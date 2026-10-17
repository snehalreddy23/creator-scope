"""Configuration settings for CreatorScope backend."""

import os
from typing import List
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "CreatorScope"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Provider configuration: "gramscraper" or "mock"
    INSTAGRAM_PROVIDER: str = os.getenv("INSTAGRAM_PROVIDER", "mock").lower()
    GRAMSCRAPER_API_KEY: str = os.getenv("GRAMSCRAPER_API_KEY", "")
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
    ]


settings = Settings()
