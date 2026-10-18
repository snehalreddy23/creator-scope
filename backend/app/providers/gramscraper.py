"""GramScraper live API provider implementation.

Based on verified GramScraper REST API specifications:
- Base: https://gramscraper.com/api/instagram/v1
- Auth: Authorization: Bearer <API_KEY>
- Profile: GET /user/by/username?username=<username>
- Posts: GET /user/medias/by/username?username=<username>
"""

import datetime
from typing import Any, Dict, List, Optional, Tuple
import httpx

from app.core.config import settings
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
from app.schemas.instagram import ContentType, InstagramPost, InstagramProfile


class GramScraperProvider(InstagramDataProvider):
    """
    Integrates with the official GramScraper REST API.
    Normalizes provider-specific responses into CreatorScope's internal schemas.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.GRAMSCRAPER_API_KEY
        self.base_url = (base_url or settings.GRAMSCRAPER_BASE_URL).rstrip("/")
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS

    def get_provider_name(self) -> str:
        return "GramScraper API (Live)"

    def is_live(self) -> bool:
        return True

    def _headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise ConfigurationError(
                "GramScraper API key is missing. Configure 'GRAMSCRAPER_API_KEY' in your environment, "
                "or switch to 'mock' provider by setting INSTAGRAM_PROVIDER=mock."
            )
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "User-Agent": "CreatorScope-SaaS/1.0",
        }

    async def get_creator_data(self, username: str) -> Tuple[InstagramProfile, List[InstagramPost]]:
        if not self.api_key:
            raise ConfigurationError(
                "GramScraper API key is missing. Configure 'GRAMSCRAPER_API_KEY' in your environment, "
                "or switch to 'mock' provider by setting INSTAGRAM_PROVIDER=mock."
            )

        headers = self._headers()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # 1. Fetch user profile
            profile_url = f"{self.base_url}/user/by/username"
            try:
                profile_resp = await client.get(
                    profile_url,
                    params={"username": username},
                    headers=headers,
                )
            except httpx.TimeoutException:
                raise ProviderTimeoutError(f"Request to GramScraper profile endpoint timed out after {self.timeout}s.")
            except httpx.RequestError as exc:
                raise ProviderUnavailableError(f"Network error connecting to GramScraper: {exc}")

            self._handle_http_errors(profile_resp, username)
            profile_raw = profile_resp.json()
            profile = self._normalize_profile(profile_raw, username)

            if profile.is_private:
                raise PrivateAccountError(username)

            # 2. Fetch recent media posts
            medias_url = f"{self.base_url}/user/medias/by/username"
            posts: List[InstagramPost] = []
            try:
                medias_resp = await client.get(
                    medias_url,
                    params={"username": username},
                    headers=headers,
                )
                if medias_resp.status_code == 200:
                    medias_raw = medias_resp.json()
                    # GramScraper sometimes returns 200 with {"detail": "Entries not found"}
                    if isinstance(medias_raw, dict) and "detail" in medias_raw and "Entries not found" in str(medias_raw.get("detail", "")):
                        posts = []
                    else:
                        posts = self._normalize_posts(medias_raw, profile.follower_count)
                elif medias_resp.status_code in {401, 403, 429}:
                    self._handle_http_errors(medias_resp, username)
                else:
                    posts = []
            except (httpx.TimeoutException, httpx.RequestError):
                posts = []

            # 3. If v1 media endpoint returned 0 posts, fallback to GraphQL endpoint using user_id (pk)
            user_id = None
            if isinstance(profile_raw, dict):
                user_id = profile_raw.get("pk") or profile_raw.get("id")
                if not user_id and isinstance(profile_raw.get("data"), dict):
                    user_id = profile_raw["data"].get("pk") or profile_raw["data"].get("id")
                    if not user_id and isinstance(profile_raw["data"].get("user"), dict):
                        user_id = profile_raw["data"]["user"].get("pk") or profile_raw["data"]["user"].get("id")

            if not posts and user_id:
                base_gql = self.base_url.rsplit("/v1", 1)[0] if "/v1" in self.base_url else self.base_url
                gql_url = f"{base_gql}/gql/user/medias"
                try:
                    gql_resp = await client.get(
                        gql_url,
                        params={"user_id": str(user_id)},
                        headers=headers,
                    )
                    if gql_resp.status_code == 200:
                        gql_raw = gql_resp.json()
                        posts = self._normalize_posts(gql_raw, profile.follower_count)
                    elif gql_resp.status_code in {401, 403, 429}:
                        self._handle_http_errors(gql_resp, username)
                except (httpx.TimeoutException, httpx.RequestError):
                    pass

            return profile, posts

    def _handle_http_errors(self, resp: httpx.Response, username: str):
        if resp.status_code == 200:
            return
        if resp.status_code == 401 or resp.status_code == 403:
            raise ProviderAuthenticationError(
                "GramScraper returned 401/403 Unauthorized. Ensure your GRAMSCRAPER_API_KEY is valid."
            )
        if resp.status_code == 404:
            raise ProfileNotFoundError(username)
        if resp.status_code == 429:
            raise ProviderRateLimitError(
                "GramScraper rate limit or account credit quota exceeded. Try again later or top up credits."
            )
        if resp.status_code >= 500:
            raise ProviderUnavailableError(
                f"GramScraper upstream error (HTTP {resp.status_code}). Service may be temporarily experiencing issues."
            )
        raise ProviderError(
            f"Unexpected response from GramScraper (HTTP {resp.status_code}): {resp.text[:200]}",
            status_code=resp.status_code,
        )

    def _normalize_profile(self, data: Any, username: str) -> InstagramProfile:
        # Some endpoints return payload wrapped in 'data' or directly at root
        payload = data.get("data", data) if isinstance(data, dict) else {}
        if isinstance(payload, dict) and "user" in payload:
            payload = payload["user"]

        is_private = bool(payload.get("is_private", False))
        is_verified = bool(payload.get("is_verified", False))

        follower_count = payload.get("follower_count")
        if follower_count is not None:
            try:
                follower_count = int(follower_count)
            except (ValueError, TypeError):
                follower_count = None

        following_count = payload.get("following_count")
        if following_count is not None:
            try:
                following_count = int(following_count)
            except (ValueError, TypeError):
                following_count = None

        media_count = payload.get("media_count")
        if media_count is not None:
            try:
                media_count = int(media_count)
            except (ValueError, TypeError):
                media_count = None

        return InstagramProfile(
            username=str(payload.get("username", username)).lower(),
            full_name=payload.get("full_name") or payload.get("name"),
            biography=payload.get("biography"),
            profile_pic_url=payload.get("profile_pic_url") or payload.get("profile_pic_url_hd"),
            external_url=payload.get("external_url"),
            category=payload.get("category"),
            is_verified=is_verified,
            is_private=is_private,
            follower_count=follower_count,
            following_count=following_count,
            media_count=media_count,
            profile_url=f"https://www.instagram.com/{username}/",
        )

    def _normalize_posts(self, data: Any, profile_followers: Optional[int]) -> List[InstagramPost]:
        items: List[Dict[str, Any]] = []
        if isinstance(data, dict):
            # 1. Check for GraphQL stream_rows structure
            if "stream_rows" in data and isinstance(data["stream_rows"], list):
                for row in data["stream_rows"]:
                    if isinstance(row, dict):
                        row_data = row.get("data")
                        if isinstance(row_data, dict) and row_data.get("id"):
                            items.append(row_data)
            else:
                # 2. Check for common wrappers: data.medias, data.items, medias, items
                inner = data.get("data", data)
                if isinstance(inner, dict):
                    items = inner.get("medias") or inner.get("items") or []
                elif isinstance(inner, list):
                    items = inner
        elif isinstance(data, list):
            items = data

        normalized_posts: List[InstagramPost] = []
        for item in items:
            if not isinstance(item, dict):
                continue

            post_id = str(item.get("id") or item.get("pk") or "")
            shortcode = item.get("shortcode") or item.get("code")
            caption_text = None
            raw_caption = item.get("caption")
            if isinstance(raw_caption, dict):
                caption_text = raw_caption.get("text")
            elif isinstance(raw_caption, str):
                caption_text = raw_caption

            # Content type mapping
            media_type_raw = str(item.get("media_type") or item.get("product_type") or "").lower()
            carousel_count = item.get("carousel_media_count") or (len(item.get("carousel_media", [])) if isinstance(item.get("carousel_media"), list) else 0)
            has_video = (
                item.get("video_versions") is not None
                or item.get("is_video") is True
                or item.get("clips_metadata") is not None
                or item.get("play_count") is not None
            )

            if (carousel_count and carousel_count > 1) or "carousel" in media_type_raw or "sidecar" in media_type_raw:
                content_type = ContentType.CAROUSEL
            elif "reel" in media_type_raw or "clips" in media_type_raw or item.get("clips_metadata") is not None or (has_video and item.get("play_count") is not None):
                content_type = ContentType.REEL
            elif "video" in media_type_raw or has_video:
                content_type = ContentType.VIDEO
            elif "image" in media_type_raw or "photo" in media_type_raw or item.get("__typename") == "GraphImage":
                content_type = ContentType.IMAGE
            else:
                content_type = ContentType.IMAGE if not has_video else ContentType.VIDEO

            # Interaction counts
            like_count = item.get("like_count")
            if like_count is not None:
                try:
                    like_count = int(like_count)
                except (ValueError, TypeError):
                    like_count = None

            comment_count = item.get("comment_count")
            if comment_count is not None:
                try:
                    comment_count = int(comment_count)
                except (ValueError, TypeError):
                    comment_count = None

            view_count = item.get("play_count") or item.get("view_count") or item.get("video_view_count") or item.get("ig_play_count")
            if view_count is not None:
                try:
                    view_count = int(view_count)
                except (ValueError, TypeError):
                    view_count = None

            timestamp = item.get("timestamp") or item.get("taken_at") or item.get("device_timestamp")
            if timestamp is None and isinstance(raw_caption, dict):
                timestamp = (
                    raw_caption.get("1lcreated_at")
                    or raw_caption.get("1lcreated_at_utc")
                    or raw_caption.get("created_at")
                )

            published_at = None
            if timestamp is not None:
                try:
                    ts = int(timestamp)
                    timestamp = ts
                    published_at = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc).isoformat()
                except Exception:
                    pass

            permalink = item.get("permalink")
            if not permalink and shortcode:
                permalink = f"https://www.instagram.com/p/{shortcode}/"

            # Per-post calculated engagement
            post_engagement_followers = None
            if profile_followers and profile_followers > 0 and like_count is not None:
                comments = comment_count or 0
                post_engagement_followers = round(
                    ((like_count + comments) / profile_followers) * 100, 2
                )

            post_engagement_views = None
            if view_count and view_count > 0 and like_count is not None:
                comments = comment_count or 0
                post_engagement_views = round(
                    ((like_count + comments) / view_count) * 100, 2
                )

            normalized_posts.append(
                InstagramPost(
                    id=post_id or shortcode or f"post_{len(normalized_posts) + 1}",
                    shortcode=shortcode,
                    permalink=permalink,
                    caption=caption_text,
                    media_type=content_type,
                    timestamp=timestamp,
                    published_at=published_at,
                    like_count=like_count,
                    comment_count=comment_count,
                    view_count=view_count,
                    engagement_by_followers_pct=post_engagement_followers,
                    engagement_by_views_pct=post_engagement_views,
                )
            )

        return normalized_posts
