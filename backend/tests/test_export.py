"""Tests for CSV export and formula injection (CWE-1236) security."""

from app.schemas.instagram import ContentType, InstagramPost
from app.services.export import export_posts_to_csv, sanitize_csv_cell


def test_sanitize_csv_cell_formula_injection():
    # Commands starting with =, +, -, @, \t, \r must be prefixed with single quote '
    assert sanitize_csv_cell("=cmd|' /C calc'!A0") == "'=cmd|' /C calc'!A0"
    assert sanitize_csv_cell("+123456") == "'+123456"
    assert sanitize_csv_cell("-2+3") == "'-2+3"
    assert sanitize_csv_cell("@SUM(A1:A10)") == "'@SUM(A1:A10)"
    assert sanitize_csv_cell("\tTabPrefix") == "'\tTabPrefix"
    assert sanitize_csv_cell("\rReturnPrefix") == "'\rReturnPrefix"

    # Benign text remains unaltered
    assert sanitize_csv_cell("Hello world") == "Hello world"
    assert sanitize_csv_cell("natgeo") == "natgeo"
    assert sanitize_csv_cell(12345) == 12345
    assert sanitize_csv_cell(None) == ""


def test_export_posts_to_csv_content():
    posts = [
        InstagramPost(
            id="p_normal",
            shortcode="ABC123xyz",
            permalink="https://www.instagram.com/p/ABC123xyz/",
            caption="=1+1 Malicious caption injection attempt",
            media_type=ContentType.IMAGE,
            published_at="2024-01-01T00:00:00Z",
            like_count=1000,
            comment_count=50,
        )
    ]

    csv_text = export_posts_to_csv(posts, "target_creator")

    assert "Creator Username,Post ID,Shortcode" in csv_text
    assert "target_creator,p_normal,ABC123xyz" in csv_text
    # Check that malicious caption was sanitized with leading quote
    assert "'=1+1 Malicious caption injection attempt" in csv_text
