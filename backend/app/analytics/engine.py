"""Analytics calculation engine for Instagram creator metrics.

All formulas follow the CreatorScope Specification:
- Transparent, reproducible calculations.
- Distinct integrity categories: Observed, Calculated, Estimated, Unavailable.
- Zero-division, missing field, and outlier handling.
"""

import statistics
from typing import Dict, List, Optional, Tuple
from app.schemas.analytics import MetricCard, ProfileAnalytics
from app.schemas.instagram import (
    ContentType,
    DataCoverage,
    InstagramPost,
    InstagramProfile,
    MetricIntegrityType,
)


def compute_arithmetic_mean(values: List[float]) -> Optional[float]:
    """Calculates arithmetic mean; returns None if input list is empty."""
    if not values:
        return None
    return round(sum(values) / len(values), 2)


def compute_median(values: List[float]) -> Optional[float]:
    """Calculates median; returns None if input list is empty."""
    if not values:
        return None
    return round(float(statistics.median(values)), 2)


def compute_profile_analytics(
    profile: InstagramProfile, posts: List[InstagramPost]
) -> ProfileAnalytics:
    """
    Computes comprehensive, honest analytics for an Instagram creator from observed post data.
    """
    total_posts_analyzed = len(posts)
    
    # 1. Observed profile KPIs
    followers_card = MetricCard[int](
        value=profile.follower_count,
        category=MetricIntegrityType.OBSERVED,
        label="Followers",
        description="Current public follower count returned by provider.",
        sample_size=None,
        is_available=profile.follower_count is not None,
    )
    
    following_card = MetricCard[int](
        value=profile.following_count,
        category=MetricIntegrityType.OBSERVED,
        label="Following",
        description="Accounts currently followed by this profile.",
        sample_size=None,
        is_available=profile.following_count is not None,
    )

    total_posts_card = MetricCard[int](
        value=profile.media_count,
        category=MetricIntegrityType.OBSERVED,
        label="Total Lifetime Posts",
        description="Total lifetime posts published by this account.",
        sample_size=None,
        is_available=profile.media_count is not None,
    )

    analyzed_card = MetricCard[int](
        value=total_posts_analyzed,
        category=MetricIntegrityType.OBSERVED,
        label="Sample Posts Analyzed",
        description="Number of recent posts retrieved and included in this analytical sample.",
        sample_size=total_posts_analyzed,
        is_available=total_posts_analyzed > 0,
    )

    # 2. Extract subsets for likes, comments, and views
    valid_likes: List[float] = [float(p.like_count) for p in posts if p.like_count is not None]
    valid_comments: List[float] = [float(p.comment_count) for p in posts if p.comment_count is not None]
    
    # Filter reel and video views
    reel_views: List[float] = [
        float(p.view_count)
        for p in posts
        if p.media_type == ContentType.REEL and p.view_count is not None and p.view_count > 0
    ]

    # Calculate likes metrics
    avg_likes = compute_arithmetic_mean(valid_likes)
    med_likes = compute_median(valid_likes)
    
    avg_likes_card = MetricCard[float](
        value=avg_likes,
        category=MetricIntegrityType.CALCULATED,
        label="Average Likes",
        description="Mean like count across analyzed sample posts with visible likes.",
        formula="Sum(likes) / Number of eligible sample posts with likes",
        sample_size=len(valid_likes),
        is_available=avg_likes is not None,
    )

    med_likes_card = MetricCard[float](
        value=med_likes,
        category=MetricIntegrityType.CALCULATED,
        label="Median Likes",
        description="Median like count across sample posts (robust against viral spikes).",
        formula="Median(likes of eligible posts)",
        sample_size=len(valid_likes),
        is_available=med_likes is not None,
    )

    # Calculate comments metrics
    avg_comments = compute_arithmetic_mean(valid_comments)
    avg_comments_card = MetricCard[float](
        value=avg_comments,
        category=MetricIntegrityType.CALCULATED,
        label="Average Comments",
        description="Mean comment count across analyzed sample posts with visible comments.",
        formula="Sum(comments) / Number of eligible sample posts with comments",
        sample_size=len(valid_comments),
        is_available=avg_comments is not None,
    )

    # Calculate reel views metrics
    avg_reel_views = compute_arithmetic_mean(reel_views)
    med_reel_views = compute_median(reel_views)

    avg_reel_card = MetricCard[float](
        value=avg_reel_views,
        category=MetricIntegrityType.CALCULATED,
        label="Average Reel Views",
        description="Arithmetic mean view count across eligible Instagram Reels with visible views.",
        formula="Sum(reel views) / Number of eligible Reels with views",
        sample_size=len(reel_views),
        is_available=avg_reel_views is not None,
    )

    med_reel_card = MetricCard[float](
        value=med_reel_views,
        category=MetricIntegrityType.CALCULATED,
        label="Median Reel Views",
        description="Median view count across eligible Instagram Reels (reduces outlier distortion).",
        formula="Median(views of eligible Reels)",
        sample_size=len(reel_views),
        is_available=med_reel_views is not None,
    )

    # 3. Calculate Engagement by Followers (Estimated)
    # Formula: (Total Interactions / (Eligible Posts * Current Followers)) * 100
    engagement_followers_val = None
    if profile.follower_count and profile.follower_count > 0 and valid_likes and len(valid_likes) > 0:
        total_sample_likes = sum(valid_likes)
        total_sample_comments = sum(valid_comments)
        total_interactions = total_sample_likes + total_sample_comments
        # Sample size used is number of posts that had interaction data
        posts_with_interactions = len(valid_likes)
        engagement_followers_val = round(
            (total_interactions / (posts_with_interactions * profile.follower_count)) * 100, 2
        )

    engagement_followers_card = MetricCard[float](
        value=engagement_followers_val,
        category=MetricIntegrityType.ESTIMATED,
        label="Engagement by Followers (Estimated)",
        description=(
            "Estimated interaction rate per follower across recent posts. "
            "Note: uses current follower denominator, as historical follower counts at post creation "
            "are not available via public endpoints."
        ),
        formula="(Total Sample Interactions / (Eligible Posts × Current Followers)) × 100",
        sample_size=len(valid_likes),
        is_available=engagement_followers_val is not None,
    )

    # 4. Calculate Engagement by Views (Interactions-to-Views Ratio)
    # Formula: (Likes + Comments on video posts / Total video views) * 100
    engagement_views_val = None
    video_posts = [p for p in posts if p.view_count and p.view_count > 0 and p.like_count is not None]
    if video_posts:
        total_video_views = sum(p.view_count for p in video_posts if p.view_count is not None)
        total_video_interactions = sum(
            (p.like_count or 0) + (p.comment_count or 0) for p in video_posts
        )
        if total_video_views > 0:
            engagement_views_val = round(
                (total_video_interactions / total_video_views) * 100, 2
            )

    engagement_views_card = MetricCard[float](
        value=engagement_views_val,
        category=MetricIntegrityType.CALCULATED,
        label="Interactions per View (%)",
        description="Ratio of total likes and comments to total views on video and Reel posts.",
        formula="(Interactions on Video Posts / Total Video Views) × 100",
        sample_size=len(video_posts),
        is_available=engagement_views_val is not None,
    )

    # 5. Posting Frequency
    posts_per_week, posts_per_month, date_range_days, earliest_date, latest_date = _compute_posting_cadence(posts)

    freq_week_card = MetricCard[float](
        value=posts_per_week,
        category=MetricIntegrityType.CALCULATED,
        label="Weekly Posting Cadence",
        description="Average number of posts published per 7-day period across the sample window.",
        formula="Total Sample Posts / (Sample Window Days / 7)",
        sample_size=total_posts_analyzed,
        is_available=posts_per_week is not None,
    )

    freq_month_card = MetricCard[float](
        value=posts_per_month,
        category=MetricIntegrityType.CALCULATED,
        label="Monthly Posting Cadence",
        description="Estimated posts published per month (30-day projection) based on the sample window.",
        formula="Weekly Cadence × (30 / 7)",
        sample_size=total_posts_analyzed,
        is_available=posts_per_month is not None,
    )

    # 6. Content Distribution
    content_distribution: Dict[str, int] = {}
    for p in posts:
        type_key = p.media_type.value if hasattr(p.media_type, "value") else str(p.media_type)
        content_distribution[type_key] = content_distribution.get(type_key, 0) + 1

    # 7. Ranked Posts
    top_by_likes = sorted(
        [p for p in posts if p.like_count is not None],
        key=lambda x: x.like_count or 0,
        reverse=True,
    )[:5]

    top_by_comments = sorted(
        [p for p in posts if p.comment_count is not None],
        key=lambda x: x.comment_count or 0,
        reverse=True,
    )[:5]

    top_by_views = sorted(
        [p for p in posts if p.view_count is not None and p.view_count > 0],
        key=lambda x: x.view_count or 0,
        reverse=True,
    )[:5]

    top_by_engagement = sorted(
        [p for p in posts if p.engagement_by_followers_pct is not None],
        key=lambda x: x.engagement_by_followers_pct or 0.0,
        reverse=True,
    )[:5]

    # 8. Data Coverage and Limitations
    missing_likes = sum(1 for p in posts if p.like_count is None)
    missing_comments = sum(1 for p in posts if p.comment_count is None)
    missing_views = sum(
        1 for p in posts if p.media_type in {ContentType.REEL, ContentType.VIDEO} and p.view_count is None
    )

    limitations: List[str] = []
    if total_posts_analyzed < 12:
        limitations.append(
            f"Small sample size ({total_posts_analyzed} posts). Metrics may exhibit higher variance."
        )
    if missing_likes > 0:
        limitations.append(
            f"{missing_likes} post(s) had hidden or unavailable like counts and were excluded from like calculations."
        )
    if missing_views > 0:
        limitations.append(
            f"{missing_views} video/reel post(s) did not return public view counts."
        )
    limitations.append(
        "Private metrics (unique reach, impressions, saves, shares, demographics) cannot be accessed from public data."
    )
    limitations.append(
        "Follower engagement rate uses current follower count as historical counts at posting time are unavailable."
    )

    coverage = DataCoverage(
        posts_analyzed=total_posts_analyzed,
        earliest_post_date=earliest_date,
        latest_post_date=latest_date,
        date_range_days=date_range_days,
        missing_like_counts=missing_likes,
        missing_comment_counts=missing_comments,
        missing_view_counts=missing_views,
        is_partial=(missing_likes > 0 or missing_comments > 0 or total_posts_analyzed < 10),
        limitations_notes=limitations,
    )

    return ProfileAnalytics(
        followers=followers_card,
        following=following_card,
        total_posts_count=total_posts_card,
        posts_analyzed=analyzed_card,
        average_likes=avg_likes_card,
        median_likes=med_likes_card,
        average_comments=avg_comments_card,
        average_reel_views=avg_reel_card,
        median_reel_views=med_reel_card,
        engagement_by_followers=engagement_followers_card,
        engagement_by_views=engagement_views_card,
        posting_frequency_per_week=freq_week_card,
        posting_frequency_per_month=freq_month_card,
        content_distribution=content_distribution,
        top_posts_by_likes=top_by_likes,
        top_posts_by_comments=top_by_comments,
        top_posts_by_views=top_by_views,
        top_posts_by_engagement=top_by_engagement,
        coverage=coverage,
    )


def _compute_posting_cadence(
    posts: List[InstagramPost],
) -> Tuple[Optional[float], Optional[float], Optional[int], Optional[str], Optional[str]]:
    """Computes posting frequency metrics based on timestamps."""
    posts_with_ts = [p for p in posts if p.timestamp is not None]
    if len(posts_with_ts) < 2:
        return None, None, None, None, None

    sorted_posts = sorted(posts_with_ts, key=lambda p: p.timestamp or 0)
    earliest_ts = sorted_posts[0].timestamp
    latest_ts = sorted_posts[-1].timestamp

    if earliest_ts is None or latest_ts is None:
        return None, None, None, None, None

    span_seconds = max(1, latest_ts - earliest_ts)
    span_days = max(1, int(span_seconds / 86400))

    earliest_date = sorted_posts[0].published_at
    latest_date = sorted_posts[-1].published_at

    weeks_span = span_days / 7.0
    if weeks_span > 0:
        posts_per_week = round(len(posts) / weeks_span, 2)
        posts_per_month = round(posts_per_week * (30.0 / 7.0), 2)
    else:
        posts_per_week = None
        posts_per_month = None

    return posts_per_week, posts_per_month, span_days, earliest_date, latest_date
