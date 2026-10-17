"""Provider factory for instantiating the appropriate Instagram data provider."""

from app.core.config import settings
from app.providers.base import ConfigurationError, InstagramDataProvider
from app.providers.gramscraper import GramScraperProvider
from app.providers.mock import MockInstagramDataProvider


def get_instagram_provider() -> InstagramDataProvider:
    """
    Returns the configured Instagram data provider based on environment settings.
    
    If 'gramscraper' is selected without a valid API key, raises a descriptive
    ConfigurationError to ensure transparent error feedback rather than silent fallback.
    """
    provider_name = settings.INSTAGRAM_PROVIDER.lower().strip()

    if provider_name == "gramscraper":
        if not settings.GRAMSCRAPER_API_KEY:
            raise ConfigurationError(
                "INSTAGRAM_PROVIDER is set to 'gramscraper', but 'GRAMSCRAPER_API_KEY' is not configured. "
                "Provide a valid GramScraper API key in .env or switch to 'mock' provider."
            )
        return GramScraperProvider()
    elif provider_name == "mock":
        return MockInstagramDataProvider()
    else:
        raise ConfigurationError(
            f"Unsupported INSTAGRAM_PROVIDER: '{provider_name}'. Supported values are 'mock' or 'gramscraper'."
        )
