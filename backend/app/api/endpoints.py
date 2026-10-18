"""API route definitions for CreatorScope."""

import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field

from app.analytics.engine import compute_profile_analytics
from app.core.config import settings
from app.core.security import ValidationError, normalize_instagram_input
from app.providers.base import (
    ConfigurationError,
    InstagramDataProvider,
    PrivateAccountError,
    ProfileNotFoundError,
    ProviderAuthenticationError,
    ProviderError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.providers.factory import get_instagram_provider
from app.schemas.analytics import AnalyzeRequest, CreatorAnalysisResult
from app.schemas.comparison import (
    ComparisonHighlight,
    ComparisonRequest,
    CreatorComparisonResult,
    CreatorComparisonRow,
)
from app.services.cache import analysis_cache
from app.services.export import export_comparison_to_csv, export_posts_to_csv
from app.services.storage import storage_service

router = APIRouter()


class SaveCreatorRequest(BaseModel):
    username: str
    notes: Optional[str] = ""
    tags: Optional[str] = ""


@router.get("/providers/status", tags=["Providers"])
async def get_provider_status():
    """Returns the current data provider status and runtime environment configuration."""
    provider_name = settings.INSTAGRAM_PROVIDER.lower().strip()
    is_live = provider_name == "gramscraper"
    has_api_key = bool(settings.GRAMSCRAPER_API_KEY)

    return {
        "configured_provider": provider_name,
        "is_live_provider": is_live,
        "api_key_configured": has_api_key,
        "cache_ttl_seconds": settings.CACHE_TTL_SECONDS,
        "provider_display_name": (
            "GramScraper API (Live)" if is_live else "CreatorScope Mock Provider (Sample Data)"
        ),
        "quota_notice": (
            "Operating with live GramScraper API. Ensure credits are available."
            if is_live
            else "Sample dataset active. Live provider key not supplied."
        ),
    }


@router.post("/analyze", response_model=CreatorAnalysisResult, tags=["Analysis"])
async def analyze_creator(
    request: AnalyzeRequest,
    provider: InstagramDataProvider = Depends(get_instagram_provider),
):
    """
    Validates input handle or URL, retrieves creator data, normalizes response,
    computes analytical metrics, and returns structured analysis.
    """
    try:
        username = normalize_instagram_input(request.input)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=str(err))

    # Check cache if not forcing refresh (and ensure cached result isn't an empty-sample artifact)
    if not request.force_refresh:
        cached = analysis_cache.get(username)
        if cached and len(cached.posts) > 0:
            return cached

    try:
        profile, posts = await provider.get_creator_data(username)
    except ProfileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err.message)
    except PrivateAccountError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err.message)
    except ProviderAuthenticationError as err:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=err.message)
    except ProviderRateLimitError as err:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=err.message)
    except ProviderTimeoutError as err:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=err.message)
    except ProviderUnavailableError as err:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=err.message)
    except ConfigurationError as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=err.message)
    except ProviderError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during profile retrieval: {str(exc)}",
        )

    # Compute analytics
    analytics = compute_profile_analytics(profile, posts)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    result = CreatorAnalysisResult(
        profile=profile,
        analytics=analytics,
        posts=posts,
        data_source=provider.get_provider_name(),
        is_mock=not provider.is_live(),
        retrieved_at=now_iso,
        is_cached=False,
    )

    # Cache result
    analysis_cache.set(username, result)

    # Record analysis history
    engagement_rate = analytics.engagement_by_followers.value
    storage_service.record_analysis(
        username=profile.username,
        followers=profile.follower_count,
        posts_analyzed=len(posts),
        engagement_rate=engagement_rate,
        is_mock=not provider.is_live(),
    )

    return result


@router.post("/compare", response_model=CreatorComparisonResult, tags=["Comparison"])
async def compare_creators(
    request: ComparisonRequest,
    provider: InstagramDataProvider = Depends(get_instagram_provider),
):
    """
    Compares 1 to 5 creators side-by-side using consistent normalization and formulas.
    """
    if len(request.identifiers) < 1 or len(request.identifiers) > settings.MAX_COMPARISON_CREATORS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You must provide between 1 and {settings.MAX_COMPARISON_CREATORS} creators to compare.",
        )

    analyzed_creators: List[CreatorAnalysisResult] = []
    comparison_rows: List[CreatorComparisonRow] = []

    for raw_id in request.identifiers:
        try:
            username = normalize_instagram_input(raw_id)
        except ValidationError as err:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid creator identifier '{raw_id}': {str(err)}",
            )

        # Check cache or fetch
        cached = None if request.force_refresh else analysis_cache.get(username)
        if cached:
            creator_result = cached
        else:
            try:
                profile, posts = await provider.get_creator_data(username)
                analytics = compute_profile_analytics(profile, posts)
                now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
                creator_result = CreatorAnalysisResult(
                    profile=profile,
                    analytics=analytics,
                    posts=posts,
                    data_source=provider.get_provider_name(),
                    is_mock=not provider.is_live(),
                    retrieved_at=now_iso,
                    is_cached=False,
                )
                analysis_cache.set(username, creator_result)
            except ProviderError as err:
                raise HTTPException(status_code=err.status_code, detail=f"Error analyzing @{username}: {err.message}")

        analyzed_creators.append(creator_result)

        # Build comparison row
        top_type = "Mixed"
        if creator_result.analytics.content_distribution:
            top_type = max(
                creator_result.analytics.content_distribution.items(), key=lambda kv: kv[1]
            )[0].title()

        row = CreatorComparisonRow(
            username=creator_result.profile.username,
            full_name=creator_result.profile.full_name,
            profile_pic_url=creator_result.profile.profile_pic_url,
            followers=creator_result.profile.follower_count,
            posts_analyzed=creator_result.analytics.posts_analyzed.value or 0,
            average_likes=creator_result.analytics.average_likes.value,
            median_likes=creator_result.analytics.median_likes.value,
            average_comments=creator_result.analytics.average_comments.value,
            average_reel_views=creator_result.analytics.average_reel_views.value,
            engagement_by_followers_pct=creator_result.analytics.engagement_by_followers.value,
            engagement_by_views_pct=creator_result.analytics.engagement_by_views.value,
            posting_frequency_per_week=creator_result.analytics.posting_frequency_per_week.value,
            top_content_type=top_type,
            is_mock=creator_result.is_mock,
            retrieved_at=creator_result.retrieved_at,
        )
        comparison_rows.append(row)

    # Compute comparative benchmarks & highlights
    highlights: List[ComparisonHighlight] = []
    if len(comparison_rows) > 1:
        # Highest engagement
        eng_rows = [r for r in comparison_rows if r.engagement_by_followers_pct is not None]
        if eng_rows:
            best_eng = max(eng_rows, key=lambda r: r.engagement_by_followers_pct or 0.0)
            highlights.append(
                ComparisonHighlight(
                    metric_label="Highest Engagement by Followers",
                    leader_username=best_eng.username,
                    value_display=f"{best_eng.engagement_by_followers_pct}%",
                    context=f"Achieves highest audience interactions per follower across recent sample posts.",
                )
            )

        # Most consistent cadence
        cadence_rows = [r for r in comparison_rows if r.posting_frequency_per_week is not None]
        if cadence_rows:
            best_cadence = max(cadence_rows, key=lambda r: r.posting_frequency_per_week or 0.0)
            highlights.append(
                ComparisonHighlight(
                    metric_label="Most Active Posting Cadence",
                    leader_username=best_cadence.username,
                    value_display=f"{best_cadence.posting_frequency_per_week} posts/week",
                    context=f"Maintains highest publishing activity across the observed window.",
                )
            )

        # Largest follower base
        follower_rows = [r for r in comparison_rows if r.followers is not None]
        if follower_rows:
            max_followers = max(follower_rows, key=lambda r: r.followers or 0)
            highlights.append(
                ComparisonHighlight(
                    metric_label="Largest Audience Size",
                    leader_username=max_followers.username,
                    value_display=f"{max_followers.followers:,}",
                    context="Highest raw public follower count.",
                )
            )

    methodology = [
        "Follower counts reflect the account status at retrieval time and are not adjusted for historical dates.",
        "Median likes provide a more reliable center point when posts feature viral anomalies.",
        "Reel metrics only include videos identified as Reels with public view counts.",
        "No creator is ranked 'best' by audience size alone; always cross-evaluate engagement ratios and cadence.",
    ]

    return CreatorComparisonResult(
        creators=analyzed_creators,
        comparison_table=comparison_rows,
        highlights=highlights,
        methodology_notes=methodology,
    )


@router.get("/export/posts/csv", tags=["Export"])
async def export_creator_posts_csv(
    username: str = Query(..., description="Username to export posts for"),
    provider: InstagramDataProvider = Depends(get_instagram_provider),
):
    """Exports analyzed posts of a creator as an RFC-4180 CSV with formula injection mitigation."""
    try:
        norm_username = normalize_instagram_input(username)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=str(err))

    # Retrieve from cache or re-fetch
    cached = analysis_cache.get(norm_username)
    if cached:
        posts = cached.posts
    else:
        try:
            profile, posts = await provider.get_creator_data(norm_username)
        except ProviderError as err:
            raise HTTPException(status_code=err.status_code, detail=err.message)

    csv_content = export_posts_to_csv(posts, norm_username)
    filename = f"{norm_username}_creatorscope_posts.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/export/compare/csv", tags=["Export"])
async def export_comparison_csv(
    request: ComparisonRequest,
    provider: InstagramDataProvider = Depends(get_instagram_provider),
):
    """Exports creator comparison results as an RFC-4180 CSV with formula injection mitigation."""
    comp_result = await compare_creators(request, provider)
    csv_content = export_comparison_to_csv(comp_result)
    filename = f"creatorscope_comparison_{len(comp_result.comparison_table)}_creators.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/saved", tags=["Saved Creators"])
async def get_saved_creators():
    """Lists saved creators from persistence store."""
    return storage_service.list_saved_creators()


@router.post("/saved", tags=["Saved Creators"])
async def save_creator(
    request: SaveCreatorRequest,
    provider: InstagramDataProvider = Depends(get_instagram_provider),
):
    """Saves a creator to persistence list."""
    try:
        username = normalize_instagram_input(request.username)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=str(err))

    # Check cache or analyze
    cached = analysis_cache.get(username)
    full_name = None
    profile_pic = None
    followers = None
    eng_rate = None

    if cached:
        full_name = cached.profile.full_name
        profile_pic = cached.profile.profile_pic_url
        followers = cached.profile.follower_count
        eng_rate = cached.analytics.engagement_by_followers.value
    else:
        try:
            profile, posts = await provider.get_creator_data(username)
            full_name = profile.full_name
            profile_pic = profile.profile_pic_url
            followers = profile.follower_count
            analytics = compute_profile_analytics(profile, posts)
            eng_rate = analytics.engagement_by_followers.value
        except ProviderError as err:
            raise HTTPException(status_code=err.status_code, detail=err.message)

    saved = storage_service.save_creator(
        username=username,
        full_name=full_name,
        profile_pic_url=profile_pic,
        follower_count=followers,
        engagement_rate=eng_rate,
        notes=request.notes,
        tags=request.tags,
    )
    return saved


@router.delete("/saved/{username}", tags=["Saved Creators"])
async def remove_saved_creator(username: str):
    """Removes a creator from saved list."""
    try:
        clean_user = normalize_instagram_input(username)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=str(err))

    success = storage_service.remove_saved_creator(clean_user)
    if not success:
        raise HTTPException(status_code=404, detail=f"@{clean_user} was not found in saved creators.")
    return {"status": "success", "message": f"@{clean_user} removed from saved creators."}


@router.get("/history", tags=["History"])
async def get_analysis_history(limit: int = Query(10, ge=1, le=50)):
    """Returns recent creator analysis history."""
    return storage_service.list_recent_analyses(limit=limit)
