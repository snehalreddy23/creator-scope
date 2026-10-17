"""Security utilities: input normalization, strict Instagram URL validation, and SSRF protection."""

import re
from typing import Optional
from urllib.parse import urlparse


RESERVED_INSTAGRAM_PATHS = {
    "p",
    "reel",
    "reels",
    "stories",
    "explore",
    "direct",
    "accounts",
    "developer",
    "about",
    "legal",
    "tv",
    "tags",
    "privacy",
    "terms",
    "directory",
    "help",
}

# Instagram username rules: 1-30 chars, alphanumeric + dots + underscores,
# no consecutive dots, cannot start or end with a dot.
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_](?:[a-zA-Z0-9_.]*[a-zA-Z0-9_])?$")


class ValidationError(ValueError):
    """Raised when input username or URL is invalid or malformed."""
    pass


def normalize_instagram_input(raw_input: str) -> str:
    """
    Validates and extracts a clean Instagram username from either a username
    or a full Instagram profile URL.
    
    Protects against SSRF and malformed requests by strictly validating
    hosts and rejecting any arbitrary external URLs.
    """
    if not raw_input or not isinstance(raw_input, str):
        raise ValidationError("Input cannot be empty.")

    cleaned = raw_input.strip()

    # Strip leading @ if user pasted @username
    if cleaned.startswith("@"):
        cleaned = cleaned[1:].strip()

    # Check if the input resembles a URL
    if "://" in cleaned or cleaned.startswith("instagram.com") or cleaned.startswith("www.instagram.com"):
        if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
            cleaned = "https://" + cleaned

        try:
            parsed = urlparse(cleaned)
        except Exception as exc:
            raise ValidationError(f"Malformed URL provided: {exc}")

        # Strict host validation for SSRF prevention
        host = (parsed.hostname or "").lower()
        if host not in {"instagram.com", "www.instagram.com"}:
            raise ValidationError(
                f"Invalid host '{host}'. Only public instagram.com profile URLs are supported."
            )

        # Extract path segments
        path_segments = [seg for seg in parsed.path.split("/") if seg]
        if not path_segments:
            raise ValidationError("Instagram profile URL must include a username path.")

        candidate = path_segments[0]
        if candidate.lower() in RESERVED_INSTAGRAM_PATHS:
            raise ValidationError(
                f"The URL points to a reserved Instagram path ('/{candidate}'), not a creator profile."
            )
        cleaned = candidate

    # Strict username validation
    if len(cleaned) < 1 or len(cleaned) > 30:
        raise ValidationError(
            f"Instagram username must be between 1 and 30 characters (got {len(cleaned)})."
        )

    if ".." in cleaned:
        raise ValidationError("Instagram username cannot contain consecutive periods.")

    if not USERNAME_REGEX.match(cleaned):
        raise ValidationError(
            f"Invalid Instagram username format '{cleaned}'. Usernames can only contain letters, numbers, periods, and underscores, and cannot start or end with a period."
        )

    return cleaned.lower()
