"""Thread-safe in-memory cache with TTL for CreatorScope."""

import datetime
import threading
from typing import Dict, Optional, Tuple
from app.core.config import settings
from app.schemas.analytics import CreatorAnalysisResult


class AnalysisCache:
    """
    Stores calculated creator analysis results to prevent redundant external API calls,
    reduce provider credit consumption, and honor rate limits.
    """

    def __init__(self, default_ttl_seconds: int = 900):
        self._default_ttl = default_ttl_seconds
        self._store: Dict[str, Tuple[CreatorAnalysisResult, float]] = {}
        self._lock = threading.Lock()

    def get(self, username: str) -> Optional[CreatorAnalysisResult]:
        key = username.lower().strip()
        now = datetime.datetime.now().timestamp()
        
        with self._lock:
            if key not in self._store:
                return None
            result, expires_at = self._store[key]
            if now > expires_at:
                del self._store[key]
                return None
            # Return cached copy marked as cached
            cached_copy = result.model_copy(deep=True)
            cached_copy.is_cached = True
            return cached_copy

    def set(
        self,
        username: str,
        result: CreatorAnalysisResult,
        ttl_seconds: Optional[int] = None,
    ) -> None:
        key = username.lower().strip()
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expires_at = datetime.datetime.now().timestamp() + ttl
        
        with self._lock:
            self._store[key] = (result, expires_at)

    def invalidate(self, username: str) -> None:
        key = username.lower().strip()
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


analysis_cache = AnalysisCache(default_ttl_seconds=settings.CACHE_TTL_SECONDS)
