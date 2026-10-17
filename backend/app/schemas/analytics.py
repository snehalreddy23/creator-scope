"""Analytics response schemas with strict metric integrity labeling."""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from app.schemas.instagram import DataCoverage, InstagramPost, InstagramProfile, MetricIntegrityType

T = TypeVar("T")


class MetricCard(BaseModel, Generic[T]):
    """Standardized representation of an analytics KPI card with methodology."""
    value: Optional[T] = None
    category: MetricIntegrityType
    label: str
    description: str
    formula: Optional[str] = None
    sample_size: Optional[int] = None
    is_available: bool = True


class ProfileAnalytics(BaseModel):
    followers: MetricCard[int]
    following: MetricCard[int]
    total_posts_count: MetricCard[int]
    posts_analyzed: MetricCard[int]
    
    # Interaction statistics
    average_likes: MetricCard[float]
    median_likes: MetricCard[float]
    average_comments: MetricCard[float]
    
    # Reel statistics
    average_reel_views: MetricCard[float]
    median_reel_views: MetricCard[float]
    
    # Engagement ratios
    engagement_by_followers: MetricCard[float]
    engagement_by_views: MetricCard[float]
    
    # Posting activity
    posting_frequency_per_week: MetricCard[float]
    posting_frequency_per_month: MetricCard[float]
    
    # Content breakdowns
    content_distribution: Dict[str, int] = Field(
        default_factory=dict, description="Count of posts per content type"
    )
    
    # Top content rankings
    top_posts_by_likes: List[InstagramPost] = Field(default_factory=list)
    top_posts_by_comments: List[InstagramPost] = Field(default_factory=list)
    top_posts_by_views: List[InstagramPost] = Field(default_factory=list)
    top_posts_by_engagement: List[InstagramPost] = Field(default_factory=list)
    
    # Coverage & Limitations
    coverage: DataCoverage


class CreatorAnalysisResult(BaseModel):
    profile: InstagramProfile
    analytics: ProfileAnalytics
    posts: List[InstagramPost] = Field(default_factory=list)
    data_source: str
    is_mock: bool = False
    retrieved_at: str
    is_cached: bool = False


class AnalyzeRequest(BaseModel):
    input: str = Field(..., description="Instagram username (e.g. natgeo) or full profile URL")
    force_refresh: bool = Field(False, description="Bypass cache and request fresh data from provider")
