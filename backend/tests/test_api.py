"""Integration and API endpoint tests for CreatorScope."""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "CreatorScope"


@pytest.mark.asyncio
async def test_provider_status():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/providers/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured_provider" in data
        assert "is_live_provider" in data
        assert "provider_display_name" in data


@pytest.mark.asyncio
async def test_analyze_valid_creator_mock():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Using preset creator natgeo
        response = await client.post("/api/analyze", json={"input": "natgeo", "force_refresh": True})
        assert response.status_code == 200
        data = response.json()
        
        assert data["profile"]["username"] == "natgeo"
        assert data["profile"]["follower_count"] is not None
        assert data["analytics"]["average_likes"]["value"] is not None
        assert data["analytics"]["median_likes"]["value"] is not None
        assert len(data["posts"]) > 0
        assert data["is_mock"] is True


@pytest.mark.asyncio
async def test_analyze_invalid_input():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid characters
        response = await client.post("/api/analyze", json={"input": "invalid!user@name", "force_refresh": True})
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_private_creator():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/analyze", json={"input": "private_creator", "force_refresh": True})
        assert response.status_code == 400
        assert "private" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_compare_creators():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/compare",
            json={"identifiers": ["natgeo", "techinsider"], "force_refresh": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["creators"]) == 2
        assert len(data["comparison_table"]) == 2
        assert len(data["highlights"]) > 0


@pytest.mark.asyncio
async def test_compare_too_many_creators():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/compare",
            json={"identifiers": ["c1", "c2", "c3", "c4", "c5", "c6"], "force_refresh": False},
        )
        assert response.status_code == 422 or response.status_code == 400


@pytest.mark.asyncio
async def test_csv_export():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/export/posts/csv?username=natgeo")
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "Creator Username" in response.text
        assert "natgeo" in response.text


@pytest.mark.asyncio
async def test_saved_creators_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Save natgeo
        save_resp = await client.post(
            "/api/saved",
            json={"username": "natgeo", "notes": "Wildlife reference", "tags": "nature,macro"},
        )
        assert save_resp.status_code == 200
        assert save_resp.json()["username"] == "natgeo"

        # List saved
        list_resp = await client.get("/api/saved")
        assert list_resp.status_code == 200
        usernames = [c["username"] for c in list_resp.json()]
        assert "natgeo" in usernames

        # Delete saved
        del_resp = await client.delete("/api/saved/natgeo")
        assert del_resp.status_code == 200


def test_gramscraper_gql_normalization():
    from app.providers.gramscraper import GramScraperProvider
    from app.schemas.instagram import ContentType

    provider = GramScraperProvider(api_key="test_key")
    sample_gql_data = {
        "stream_rows": [
            {
                "data": {
                    "id": "3422301187381762542_12521208589",
                    "code": "C9-dMw8SZnu",
                    "like_count": 3643,
                    "comment_count": 70,
                    "carousel_media_count": 7,
                    "caption": {"text": "Can I still be a teen? Twenteen?", "1lcreated_at": 1722190116},
                }
            },
            {
                "data": {
                    "id": "4009138741748876289_12521208589",
                    "code": "DejUnG9MsQB",
                    "like_count": 750,
                    "comment_count": 28,
                    "play_count": 11994,
                    "caption": {"text": "Dishquan 🔫🔫", "1lcreated_at": 1792147469},
                }
            },
        ]
    }

    posts = provider._normalize_posts(sample_gql_data, profile_followers=26703)
    assert len(posts) == 2
    assert posts[0].id == "3422301187381762542_12521208589"
    assert posts[0].shortcode == "C9-dMw8SZnu"
    assert posts[0].media_type == ContentType.CAROUSEL
    assert posts[0].like_count == 3643
    assert posts[0].comment_count == 70
    assert posts[0].timestamp == 1722190116

    assert posts[1].id == "4009138741748876289_12521208589"
    assert posts[1].media_type == ContentType.REEL
    assert posts[1].like_count == 750
    assert posts[1].view_count == 11994

