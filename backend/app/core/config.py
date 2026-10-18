"""Configuration settings for CreatorScope backend."""

import os
from typing import List
from pydantic import BaseModel


def _resolve_provider_and_key():
    raw_prov = os.getenv("INSTAGRAM_PROVIDER", "mock").strip("\"' ")
    raw_key = os.getenv("GRAMSCRAPER_API_KEY", "").strip("\"' ")

    # Strip Bearer prefix if user copied full header value
    if raw_key.lower().startswith("bearer "):
        raw_key = raw_key[7:].strip()
    if raw_prov.lower().startswith("bearer "):
        raw_prov = raw_prov[7:].strip()

    # Auto-heal: If user pasted the API key (gs_...) into INSTAGRAM_PROVIDER
    if raw_prov.lower().startswith("gs_"):
        if not raw_key:
            raw_key = raw_prov
        prov = "gramscraper"
    # Auto-heal: If user accidentally swapped the two values
    elif raw_key.lower() == "gramscraper" and raw_prov:
        raw_key = raw_prov
        prov = "gramscraper"
    else:
        prov = raw_prov.lower() if raw_prov else "mock"

    return prov, raw_key


_provider, _api_key = _resolve_provider_and_key()


class Settings(BaseModel):
    PROJECT_NAME: str = "CreatorScope"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Provider configuration: "gramscraper" or "mock"
    INSTAGRAM_PROVIDER: str = _provider
    GRAMSCRAPER_API_KEY: str = _api_key
    GRAMSCRAPER_BASE_URL: str = os.getenv(
        "GRAMSCRAPER_BASE_URL", "https://gramscraper.com/api/instagram/v1"
    )
    
    # Cache configuration (default: 15 minutes = 900 seconds)
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "900"))
    
    # Request limits
    MAX_COMPARISON_CREATORS: int = 5
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "12.0"))
    
    # Rate limiting (requests per minute per IP for analysis)
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://creatorscope.vercel.app",
        "https://creator-scope-three.vercel.app",
    ]


settings = Settings()
