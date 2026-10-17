"""Comparison schemas for evaluating up to 5 creators side-by-side."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.analytics import CreatorAnalysisResult


class ComparisonRequest(BaseModel):
    identifiers: List[str] = Field(
        ...,
        min_length=1,
        max_length=5,
        description="List of 1 to 5 Instagram usernames or profile URLs to compare",
    )
    force_refresh: bool = Field(False, description="Force fresh data retrieval for all profiles")


class CreatorComparisonRow(BaseModel):
    username: str
    full_name: Optional[str] = None
    profile_pic_url: Optional[str] = None
    followers: Optional[int] = None
    posts_analyzed: int
    average_likes: Optional[float] = None
    median_likes: Optional[float] = None
    average_comments: Optional[float] = None
    average_reel_views: Optional[float] = None
    engagement_by_followers_pct: Optional[float] = None
    engagement_by_views_pct: Optional[float] = None
    posting_frequency_per_week: Optional[float] = None
    top_content_type: Optional[str] = None
    is_mock: bool = False
    retrieved_at: str


class ComparisonHighlight(BaseModel):
    metric_label: str
    leader_username: str
    value_display: str
    context: str


class CreatorComparisonResult(BaseModel):
    creators: List[CreatorAnalysisResult]
    comparison_table: List[CreatorComparisonRow]
    highlights: List[ComparisonHighlight] = Field(default_factory=list)
    methodology_notes: List[str] = Field(default_factory=list)
