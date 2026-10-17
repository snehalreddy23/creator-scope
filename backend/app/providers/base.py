"""Base abstract provider interface for Instagram data retrieval."""

from abc import ABC, abstractmethod
from typing import List, Tuple
from app.schemas.instagram import InstagramPost, InstagramProfile


class ProviderError(Exception):
    """Base exception for all provider operations."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ProfileNotFoundError(ProviderError):
    def __init__(self, username: str):
        super().__init__(f"Instagram creator '@{username}' was not found. Please verify the handle.", 404)


class PrivateAccountError(ProviderError):
    def __init__(self, username: str):
        super().__init__(
            f"Instagram account '@{username}' is private. CreatorScope only analyzes public creator accounts.",
            400,
        )


class ProviderAuthenticationError(ProviderError):
    def __init__(self, message: str = "Provider authentication failed. Check API key configuration."):
        super().__init__(message, 401)


class ProviderRateLimitError(ProviderError):
    def __init__(self, message: str = "Data provider rate limit or credit quota exceeded."):
        super().__init__(message, 429)


class ProviderTimeoutError(ProviderError):
    def __init__(self, message: str = "Upstream provider timed out while fetching Instagram data."):
        super().__init__(message, 504)


class ProviderUnavailableError(ProviderError):
    def __init__(self, message: str = "Upstream Instagram data service is temporarily unavailable."):
        super().__init__(message, 502)


class ConfigurationError(ProviderError):
    def __init__(self, message: str):
        super().__init__(message, 500)


class InstagramDataProvider(ABC):
    """Common interface for retrieving Instagram profile and media data."""

    @abstractmethod
    async def get_creator_data(self, username: str) -> Tuple[InstagramProfile, List[InstagramPost]]:
        """
        Retrieves normalized profile details and recent posts for the given username.
        
        Returns:
            Tuple of (InstagramProfile, List[InstagramPost])
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """User-friendly name of the provider."""
        pass

    @abstractmethod
    def is_live(self) -> bool:
        """True if connecting to live external API; False if mock/sample."""
        pass
