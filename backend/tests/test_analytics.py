"""Tests for analytical formulas, median vs mean calculations, and metric integrity."""

import pytest
from app.analytics.engine import (
    compute_arithmetic_mean,
    compute_median,
    compute_profile_analytics,
)
from app.schemas.instagram import (
    ContentType,
    InstagramPost,
    InstagramProfile,
    MetricIntegrityType,
)


def test_mean_and_median_calculations():
    assert compute_arithmetic_mean([]) is None
    assert compute_median([]) is None

    # Normal list
    vals = [10.0, 20.0, 30.0]
    assert compute_arithmetic_mean(vals) == 20.0
    assert compute_median(vals) == 20.0

    # Skewed list with severe outlier (viral post)
    # 5 posts: 100, 100, 100, 100, 10000
    skewed = [100.0, 100.0, 100.0, 100.0, 10000.0]
    # Mean: 10400 / 5 = 2080.0
    assert compute_arithmetic_mean(skewed) == 2080.0
    # Median: 100.0 (resistant to outlier!)
    assert compute_median(skewed) == 100.0

    # Even number of elements
    even_vals = [10.0, 20.0, 30.0, 40.0]
    assert compute_median(even_vals) == 25.0


def test_profile_analytics_zero_followers_and_empty_posts():
    profile = InstagramProfile(
        username="empty_creator",
        follower_count=0,
        following_count=10,
        media_count=0,
        profile_url="https://www.instagram.com/empty_creator/",
    )
    posts: list[InstagramPost] = []

    analytics = compute_profile_analytics(profile, posts)

    assert analytics.followers.value == 0
    assert analytics.posts_analyzed.value == 0
    assert analytics.average_likes.value is None
    assert analytics.median_likes.value is None
    assert analytics.average_comments.value is None
    assert analytics.engagement_by_followers.value is None
    assert analytics.engagement_by_views.value is None
    assert analytics.coverage.posts_analyzed == 0


def test_profile_analytics_realistic_sample():
    profile = InstagramProfile(
        username="sample_creator",
        follower_count=10000,
        following_count=200,
        media_count=50,
        profile_url="https://www.instagram.com/sample_creator/",
    )

    posts = [
        InstagramPost(
            id="p1",
            media_type=ContentType.IMAGE,
            timestamp=1700000000,
            published_at="2023-11-14T22:13:20Z",
            like_count=500,
            comment_count=50,
        ),
        InstagramPost(
            id="p2",
            media_type=ContentType.REEL,
            timestamp=1700100000,
            published_at="2023-11-16T02:00:00Z",
            like_count=700,
            comment_count=100,
            view_count=10000,
        ),
        InstagramPost(
            id="p3",
            media_type=ContentType.CAROUSEL,
            timestamp=1700200000,
            published_at="2023-11-17T05:46:40Z",
            like_count=300,
            comment_count=20,
        ),
    ]

    analytics = compute_profile_analytics(profile, posts)

    # 3 posts analyzed
    assert analytics.posts_analyzed.value == 3
    
    # Likes: 500, 700, 300 -> mean = 500.0, median = 500.0
    assert analytics.average_likes.value == 500.0
    assert analytics.median_likes.value == 500.0
    
    # Comments: 50, 100, 20 -> mean = (170 / 3) = 56.67
    assert analytics.average_comments.value == 56.67

    # Reel views: 1 reel with 10000 views -> mean = 10000.0, median = 10000.0
    assert analytics.average_reel_views.value == 10000.0
    assert analytics.median_reel_views.value == 10000.0

    # Engagement by followers:
    # Total interactions: (500+50) + (700+100) + (300+20) = 550 + 800 + 320 = 1670
    # Formula: (1670 / (3 * 10000)) * 100 = (1670 / 30000) * 100 = 5.57%
    assert analytics.engagement_by_followers.value == 5.57
    assert analytics.engagement_by_followers.category == MetricIntegrityType.ESTIMATED

    # Engagement by views (video/reel posts):
    # Only p2 is video/reel with 10000 views and (700+100) = 800 interactions
    # Formula: (800 / 10000) * 100 = 8.0%
    assert analytics.engagement_by_views.value == 8.0
    assert analytics.engagement_by_views.category == MetricIntegrityType.CALCULATED

    # Content breakdown
    assert analytics.content_distribution == {"image": 1, "reel": 1, "carousel": 1}
