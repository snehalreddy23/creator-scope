"""Export service generating sanitized, RFC-4180 compliant CSVs with formula-injection protection."""

import csv
import io
from typing import Any, List
from app.schemas.comparison import CreatorComparisonResult
from app.schemas.instagram import InstagramPost

# Characters that trigger spreadsheet formula execution in Excel/Google Sheets/LibreOffice
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def sanitize_csv_cell(value: Any) -> Any:
    """
    Prevents CSV Formula Injection (CWE-1236).
    If a string value starts with formula characters, prepends an apostrophe (').
    """
    if value is None:
        return ""
    if isinstance(value, str):
        # Check raw string or string stripped of standard space padding
        lspaced = value.lstrip(" ")
        if value.startswith(FORMULA_PREFIXES) or lspaced.startswith(FORMULA_PREFIXES):
            return f"'{value}"
        return value
    return value


def export_posts_to_csv(posts: List[InstagramPost], username: str) -> str:
    """Exports a creator's analyzed posts to a clean, sanitized CSV string."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    headers = [
        "Creator Username",
        "Post ID",
        "Shortcode",
        "Content Type",
        "Publication Date (UTC)",
        "Likes",
        "Comments",
        "Views / Plays",
        "Interactions Per Follower (%)",
        "Interactions Per View (%)",
        "Permalink",
        "Caption",
    ]
    writer.writerow(headers)

    for post in posts:
        media_type = post.media_type.value if hasattr(post.media_type, "value") else str(post.media_type)
        row = [
            sanitize_csv_cell(username),
            sanitize_csv_cell(post.id),
            sanitize_csv_cell(post.shortcode or ""),
            sanitize_csv_cell(media_type),
            sanitize_csv_cell(post.published_at or ""),
            sanitize_csv_cell(post.like_count if post.like_count is not None else "Unavailable"),
            sanitize_csv_cell(post.comment_count if post.comment_count is not None else "Unavailable"),
            sanitize_csv_cell(post.view_count if post.view_count is not None else "Unavailable"),
            sanitize_csv_cell(
                f"{post.engagement_by_followers_pct}%"
                if post.engagement_by_followers_pct is not None
                else "Unavailable"
            ),
            sanitize_csv_cell(
                f"{post.engagement_by_views_pct}%"
                if post.engagement_by_views_pct is not None
                else "Unavailable"
            ),
            sanitize_csv_cell(post.permalink or ""),
            sanitize_csv_cell(post.caption or ""),
        ]
        writer.writerow(row)

    return output.getvalue()


def export_comparison_to_csv(comparison: CreatorComparisonResult) -> str:
    """Exports creator comparison rows to a clean, sanitized CSV string."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    headers = [
        "Username",
        "Full Name",
        "Followers",
        "Sample Posts Analyzed",
        "Average Likes",
        "Median Likes",
        "Average Comments",
        "Average Reel Views",
        "Engagement by Followers (%)",
        "Interactions per View (%)",
        "Weekly Cadence",
        "Top Content Type",
        "Data Source Type",
        "Retrieved At",
    ]
    writer.writerow(headers)

    for row in comparison.comparison_table:
        data_row = [
            sanitize_csv_cell(row.username),
            sanitize_csv_cell(row.full_name or ""),
            sanitize_csv_cell(row.followers if row.followers is not None else "Unavailable"),
            sanitize_csv_cell(row.posts_analyzed),
            sanitize_csv_cell(row.average_likes if row.average_likes is not None else "Unavailable"),
            sanitize_csv_cell(row.median_likes if row.median_likes is not None else "Unavailable"),
            sanitize_csv_cell(row.average_comments if row.average_comments is not None else "Unavailable"),
            sanitize_csv_cell(row.average_reel_views if row.average_reel_views is not None else "Unavailable"),
            sanitize_csv_cell(
                f"{row.engagement_by_followers_pct}%"
                if row.engagement_by_followers_pct is not None
                else "Unavailable"
            ),
            sanitize_csv_cell(
                f"{row.engagement_by_views_pct}%"
                if row.engagement_by_views_pct is not None
                else "Unavailable"
            ),
            sanitize_csv_cell(
                row.posting_frequency_per_week if row.posting_frequency_per_week is not None else "Unavailable"
            ),
            sanitize_csv_cell(row.top_content_type or "Mixed"),
            sanitize_csv_cell("Mock Dataset" if row.is_mock else "Live Provider"),
            sanitize_csv_cell(row.retrieved_at),
        ]
        writer.writerow(data_row)

    return output.getvalue()
