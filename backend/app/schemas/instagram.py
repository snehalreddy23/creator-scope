"""Instagram data schemas and metric integrity annotations."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class MetricIntegrityType(str, Enum):
    """
    Distinguishes data integrity levels as required by CreatorScope specification:
    1. OBSERVED: Directly returned by provider (e.g. followers, likes on posts)
    2. CALCULATED: Derived via reproducible formulas (e.g. average likes, median)
    3. ESTIMATED: Derived via approximation (e.g. engagement using current follower denominator)
    4. MANUALLY_ENTERED: Supplied by the user
    5. UNAVAILABLE: Not returned or cannot be reliably computed
    """
    OBSERVED = "observed"
    CALCULATED = "calculated"
    ESTIMATED = "estimated"
    MANUALLY_ENTERED = "manually_entered"
    UNAVAILABLE = "unavailable"


class ContentType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    REEL = "reel"
    CAROUSEL = "carousel"
    UNKNOWN = "unknown"


class InstagramProfile(BaseModel):
    username: str
    full_name: Optional[str] = None
    biography: Optional[str] = None
    profile_pic_url: Optional[str] = None
    external_url: Optional[str] = None
    category: Optional[str] = None
    is_verified: bool = False
    is_private: bool = False
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    media_count: Optional[int] = None
    profile_url: str = Field(description="Direct web URL to the Instagram profile")


class InstagramPost(BaseModel):
    id: str
    shortcode: Optional[str] = None
    permalink: Optional[str] = None
    caption: Optional[str] = None
    media_type: ContentType = ContentType.UNKNOWN
    timestamp: Optional[int] = Field(None, description="Unix timestamp of publication")
    published_at: Optional[str] = Field(None, description="ISO formatted publication date")
    like_count: Optional[int] = None
    comment_count: Optional[int] = None
    view_count: Optional[int] = Field(None, description="Video/Reel play or view count if available")
    engagement_by_followers_pct: Optional[float] = Field(
        None, description="Estimated post-level interactions per follower (%)"
    )
    engagement_by_views_pct: Optional[float] = Field(
        None, description="Post-level interactions per view (%) for videos/reels"
    )


class DataCoverage(BaseModel):
    posts_analyzed: int = 0
    earliest_post_date: Optional[str] = None
    latest_post_date: Optional[str] = None
    date_range_days: Optional[int] = None
    missing_like_counts: int = 0
    missing_comment_counts: int = 0
    missing_view_counts: int = 0
    is_partial: bool = False
    limitations_notes: List[str] = Field(default_factory=list)
