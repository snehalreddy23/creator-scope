"""Tests for Instagram username and profile URL normalization and SSRF protection."""

import pytest
from app.core.security import ValidationError, normalize_instagram_input


def test_valid_usernames():
    assert normalize_instagram_input("natgeo") == "natgeo"
    assert normalize_instagram_input("@natgeo") == "natgeo"
    assert normalize_instagram_input("tech.insider") == "tech.insider"
    assert normalize_instagram_input("alex_rivera_fit") == "alex_rivera_fit"
    assert normalize_instagram_input("   cristiano   ") == "cristiano"
    assert normalize_instagram_input("@creator_123") == "creator_123"


def test_valid_urls():
    assert normalize_instagram_input("https://www.instagram.com/natgeo/") == "natgeo"
    assert normalize_instagram_input("https://instagram.com/techinsider") == "techinsider"
    assert normalize_instagram_input("http://instagram.com/fitcoach_alex/") == "fitcoach_alex"
    assert normalize_instagram_input("instagram.com/culinary_wanderer") == "culinary_wanderer"
    assert normalize_instagram_input("www.instagram.com/nike") == "nike"


def test_invalid_usernames():
    with pytest.raises(ValidationError):
        normalize_instagram_input("")
    with pytest.raises(ValidationError):
        normalize_instagram_input("   ")
    with pytest.raises(ValidationError):
        normalize_instagram_input(".startwithdot")
    with pytest.raises(ValidationError):
        normalize_instagram_input("endwithdot.")
    with pytest.raises(ValidationError):
        normalize_instagram_input("two..dots")
    with pytest.raises(ValidationError):
        normalize_instagram_input("has spaces here")
    with pytest.raises(ValidationError):
        normalize_instagram_input("special$symbols!")
    with pytest.raises(ValidationError):
        normalize_instagram_input("a" * 31)  # Instagram maximum length is 30


def test_ssrf_and_host_validation():
    # Attempting to fetch arbitrary external domains
    with pytest.raises(ValidationError, match="Invalid host"):
        normalize_instagram_input("https://evil.com/natgeo")
    with pytest.raises(ValidationError, match="Invalid host"):
        normalize_instagram_input("http://169.254.169.254/latest/meta-data")
    with pytest.raises(ValidationError, match="Invalid host"):
        normalize_instagram_input("https://facebook.com/natgeo")


def test_reserved_paths():
    with pytest.raises(ValidationError, match="reserved Instagram path"):
        normalize_instagram_input("https://www.instagram.com/p/C9z81AA/")
    with pytest.raises(ValidationError, match="reserved Instagram path"):
        normalize_instagram_input("https://www.instagram.com/reel/C9z81AA/")
    with pytest.raises(ValidationError, match="reserved Instagram path"):
        normalize_instagram_input("https://instagram.com/explore/")
    with pytest.raises(ValidationError, match="reserved Instagram path"):
        normalize_instagram_input("https://instagram.com/stories/username/123")
