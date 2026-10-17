"""Mock Instagram data provider providing realistic, deterministic sample data.

Clearly marked as mock data for testing, demonstration, and local development.
Never pretends to be live Instagram data.
"""

import datetime
import hashlib
from typing import Dict, List, Tuple
from app.providers.base import (
    InstagramDataProvider,
    PrivateAccountError,
    ProfileNotFoundError,
)
from app.schemas.instagram import ContentType, InstagramPost, InstagramProfile


class MockInstagramDataProvider(InstagramDataProvider):
    """
    Supplies realistic, explicitly labeled mock Instagram profile and media data.
    Ensures end-to-end functionality without incurring third-party API costs or credential requirements.
    """

    def get_provider_name(self) -> str:
        return "CreatorScope Mock Provider (Sample Data)"

    def is_live(self) -> bool:
        return False

    async def get_creator_data(self, username: str) -> Tuple[InstagramProfile, List[InstagramPost]]:
        normalized = username.lower()

        # Handle explicit test condition fixtures
        if normalized in {"private_creator", "private_user"}:
            raise PrivateAccountError(normalized)
        if normalized in {"not_found_creator", "nonexistent_account"}:
            raise ProfileNotFoundError(normalized)

        # Check for pre-built rich profiles
        if normalized in PRESET_PROFILES:
            profile_data, posts_data = PRESET_PROFILES[normalized]
            profile = InstagramProfile(**profile_data)
            posts = [
                self._compute_post_engagements(InstagramPost(**p), profile.follower_count)
                for p in posts_data
            ]
            return profile, posts

        # Deterministic generation for any arbitrary username tested by the user
        return self._generate_deterministic_creator(normalized)

    def _compute_post_engagements(self, post: InstagramPost, followers: int) -> InstagramPost:
        if followers and followers > 0 and post.like_count is not None:
            comments = post.comment_count or 0
            post.engagement_by_followers_pct = round(
                ((post.like_count + comments) / followers) * 100, 2
            )
        if post.view_count and post.view_count > 0 and post.like_count is not None:
            comments = post.comment_count or 0
            post.engagement_by_views_pct = round(
                ((post.like_count + comments) / post.view_count) * 100, 2
            )
        return post

    def _generate_deterministic_creator(self, username: str) -> Tuple[InstagramProfile, List[InstagramPost]]:
        # Hash username to seed deterministic values
        seed = int(hashlib.md5(username.encode("utf-8")).hexdigest()[:8], 16)
        
        follower_count = 15000 + (seed % 950000)
        following_count = 200 + (seed % 1200)
        media_count = 80 + (seed % 600)
        
        display_name = username.replace("_", " ").replace(".", " ").title()
        
        profile = InstagramProfile(
            username=username,
            full_name=f"{display_name} (Sample Profile)",
            biography=f"Creator & Content Strategist 📸 Exploring digital storytelling and visual aesthetics. Contact: hello@{username}.media",
            profile_pic_url=f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            external_url=f"https://{username}.link",
            category="Creator / Public Figure",
            is_verified=(seed % 3 == 0),
            is_private=False,
            follower_count=follower_count,
            following_count=following_count,
            media_count=media_count,
            profile_url=f"https://www.instagram.com/{username}/",
        )

        posts: List[InstagramPost] = []
        now = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        
        # Generate 14 recent posts
        content_types = [ContentType.IMAGE, ContentType.CAROUSEL, ContentType.REEL, ContentType.IMAGE, ContentType.REEL]
        base_likes = int(follower_count * 0.032) # ~3.2% engagement baseline
        
        for i in range(14):
            post_seed = (seed + i * 31) % 1000
            days_ago = i * 2 + 1
            ts = now - (days_ago * 86400) - (post_seed * 40)
            published_at = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc).isoformat()
            
            c_type = content_types[i % len(content_types)]
            like_mult = 0.6 + ((post_seed % 80) / 100.0)
            likes = max(10, int(base_likes * like_mult))
            comments = max(2, int(likes * (0.02 + ((post_seed % 40) / 1000.0))))
            
            views = None
            if c_type in {ContentType.REEL, ContentType.VIDEO}:
                view_mult = 3.5 + ((post_seed % 50) / 10.0)
                views = int(likes * view_mult)

            shortcode = f"C{seed % 99999}{i:02d}"
            post = InstagramPost(
                id=f"mock_post_{username}_{i+1}",
                shortcode=shortcode,
                permalink=f"https://www.instagram.com/p/{shortcode}/",
                caption=f"Episode {i+1}: Sharing insights and perspective on our latest community project. Drop your thoughts below! #{username} #creatorscope",
                media_type=c_type,
                timestamp=ts,
                published_at=published_at,
                like_count=likes,
                comment_count=comments,
                view_count=views,
            )
            posts.append(self._compute_post_engagements(post, follower_count))

        return profile, posts


PRESET_PROFILES: Dict[str, Tuple[Dict, List[Dict]]] = {
    "natgeo": (
        {
            "username": "natgeo",
            "full_name": "National Geographic",
            "biography": "Experience the world through the eyes of National Geographic photographers and storytellers.",
            "profile_pic_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
            "external_url": "https://www.nationalgeographic.com",
            "category": "Media / News Company",
            "is_verified": True,
            "is_private": False,
            "follower_count": 283000000,
            "following_count": 142,
            "media_count": 28450,
            "profile_url": "https://www.instagram.com/natgeo/",
        },
        [
            {
                "id": "natgeo_1",
                "shortcode": "C9z81AA",
                "permalink": "https://www.instagram.com/p/C9z81AA/",
                "caption": "Photo by @thomaspesquet: Glaciers glowing under sunrise from orbit. Every morning brings a new perspective on our planet's fragile ecosystems.",
                "media_type": ContentType.IMAGE,
                "timestamp": 1729000000,
                "published_at": "2024-10-15T13:46:40Z",
                "like_count": 245000,
                "comment_count": 1820,
                "view_count": None,
            },
            {
                "id": "natgeo_2",
                "shortcode": "C9z82BB",
                "permalink": "https://www.instagram.com/p/C9z82BB/",
                "caption": "Video by @bertiegregory: A rare encounter with leopard seals navigating Antarctic pack ice.",
                "media_type": ContentType.REEL,
                "timestamp": 1728800000,
                "published_at": "2024-10-13T06:13:20Z",
                "like_count": 420000,
                "comment_count": 3100,
                "view_count": 5800000,
            },
            {
                "id": "natgeo_3",
                "shortcode": "C9z83CC",
                "permalink": "https://www.instagram.com/p/C9z83CC/",
                "caption": "Swipe through for field dispatches from the Amazon basin: documenting elusive river dolphins.",
                "media_type": ContentType.CAROUSEL,
                "timestamp": 1728600000,
                "published_at": "2024-10-10T22:40:00Z",
                "like_count": 189000,
                "comment_count": 1250,
                "view_count": None,
            },
            {
                "id": "natgeo_4",
                "shortcode": "C9z84DD",
                "permalink": "https://www.instagram.com/p/C9z84DD/",
                "caption": "Night falls over the Sahara dunes. Photographed on medium format under full moon illumination.",
                "media_type": ContentType.IMAGE,
                "timestamp": 1728400000,
                "published_at": "2024-10-08T15:06:40Z",
                "like_count": 312000,
                "comment_count": 2400,
                "view_count": None,
            },
            {
                "id": "natgeo_5",
                "shortcode": "C9z85EE",
                "permalink": "https://www.instagram.com/p/C9z85EE/",
                "caption": "Behind the lens: 48 hours waiting inside a blind in Alaska for the salmon run.",
                "media_type": ContentType.REEL,
                "timestamp": 1728200000,
                "published_at": "2024-10-06T07:33:20Z",
                "like_count": 510000,
                "comment_count": 4200,
                "view_count": 7200000,
            },
        ],
    ),
    "techinsider": (
        {
            "username": "techinsider",
            "full_name": "Tech Insider",
            "biography": "All things tech, gadgets, AI, and futuristic innovations. Follow for hands-on deep dives.",
            "profile_pic_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            "external_url": "https://techinsider.io",
            "category": "Science & Tech",
            "is_verified": True,
            "is_private": False,
            "follower_count": 4200000,
            "following_count": 310,
            "media_count": 3820,
            "profile_url": "https://www.instagram.com/techinsider/",
        },
        [
            {
                "id": "tech_1",
                "shortcode": "TechA01",
                "permalink": "https://www.instagram.com/p/TechA01/",
                "caption": "We tested the newest transparent display laptop for a week. Is it actually practical?",
                "media_type": ContentType.REEL,
                "timestamp": 1729100000,
                "published_at": "2024-10-16T17:33:20Z",
                "like_count": 89000,
                "comment_count": 2150,
                "view_count": 1420000,
            },
            {
                "id": "tech_2",
                "shortcode": "TechA02",
                "permalink": "https://www.instagram.com/p/TechA02/",
                "caption": "Inside a robotics lab building autonomous biomimetic drones. Sound on for turbine acoustics!",
                "media_type": ContentType.REEL,
                "timestamp": 1728900000,
                "published_at": "2024-10-14T10:00:00Z",
                "like_count": 112000,
                "comment_count": 3400,
                "view_count": 2100000,
            },
            {
                "id": "tech_3",
                "shortcode": "TechA03",
                "permalink": "https://www.instagram.com/p/TechA03/",
                "caption": "Infographic breakdown: Evolution of neural network parameters over the last decade.",
                "media_type": ContentType.CAROUSEL,
                "timestamp": 1728700000,
                "published_at": "2024-10-12T02:26:40Z",
                "like_count": 45000,
                "comment_count": 980,
                "view_count": None,
            },
            {
                "id": "tech_4",
                "shortcode": "TechA04",
                "permalink": "https://www.instagram.com/p/TechA04/",
                "caption": "Battery breakthrough: Solid state batteries pass thermal stress testing at 60C.",
                "media_type": ContentType.IMAGE,
                "timestamp": 1728500000,
                "published_at": "2024-10-09T18:53:20Z",
                "like_count": 62000,
                "comment_count": 1400,
                "view_count": None,
            },
        ],
    ),
    "fitcoach_alex": (
        {
            "username": "fitcoach_alex",
            "full_name": "Alex Rivera | Fitness & Mobility",
            "biography": "Certified CSCS Coach 🏋️‍♂️ Helping desk workers build pain-free strength & joint mobility. Workouts & evidence-based training.",
            "profile_pic_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            "external_url": "https://alexriverafit.com/programs",
            "category": "Fitness Trainer",
            "is_verified": False,
            "is_private": False,
            "follower_count": 284000,
            "following_count": 640,
            "media_count": 512,
            "profile_url": "https://www.instagram.com/fitcoach_alex/",
        },
        [
            {
                "id": "fit_1",
                "shortcode": "FitR01",
                "permalink": "https://www.instagram.com/p/FitR01/",
                "caption": "5-minute hip mobility routine you can do between Zoom meetings. Save this for tomorrow!",
                "media_type": ContentType.REEL,
                "timestamp": 1729050000,
                "published_at": "2024-10-16T03:40:00Z",
                "like_count": 18200,
                "comment_count": 740,
                "view_count": 310000,
            },
            {
                "id": "fit_2",
                "shortcode": "FitR02",
                "permalink": "https://www.instagram.com/p/FitR02/",
                "caption": "Stop arching your lumbar spine on overhead presses. Here is the 2-step cue that fixes it instantly.",
                "media_type": ContentType.REEL,
                "timestamp": 1728850000,
                "published_at": "2024-10-13T20:06:40Z",
                "like_count": 24100,
                "comment_count": 920,
                "view_count": 480000,
            },
            {
                "id": "fit_3",
                "shortcode": "FitR03",
                "permalink": "https://www.instagram.com/p/FitR03/",
                "caption": "High-protein meal prep blueprint for busy weekdays: 4 recipes, under 45 minutes total cook time.",
                "media_type": ContentType.CAROUSEL,
                "timestamp": 1728650000,
                "published_at": "2024-10-11T12:33:20Z",
                "like_count": 15400,
                "comment_count": 680,
                "view_count": None,
            },
            {
                "id": "fit_4",
                "shortcode": "FitR04",
                "permalink": "https://www.instagram.com/p/FitR04/",
                "caption": "Client spotlight: 6 months of consistent tendon conditioning and posture correction.",
                "media_type": ContentType.IMAGE,
                "timestamp": 1728450000,
                "published_at": "2024-10-09T05:00:00Z",
                "like_count": 11300,
                "comment_count": 430,
                "view_count": None,
            },
        ],
    ),
    "culinary_wanderer": (
        {
            "username": "culinary_wanderer",
            "full_name": "Maya Lin | Food & Travel",
            "biography": "Exploring street food markets and artisanal bakeries around the globe 🍜 Kyoto -> Oaxaca -> Naples. Recipes in bio.",
            "profile_pic_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            "external_url": "https://culinarywanderer.blog",
            "category": "Food & Beverage",
            "is_verified": False,
            "is_private": False,
            "follower_count": 74500,
            "following_count": 520,
            "media_count": 340,
            "profile_url": "https://www.instagram.com/culinary_wanderer/",
        },
        [
            {
                "id": "cul_1",
                "shortcode": "CulW01",
                "permalink": "https://www.instagram.com/p/CulW01/",
                "caption": "Found a 70-year-old udon master tucked in an alleyway in Osaka. The broth simmered for 18 hours.",
                "media_type": ContentType.REEL,
                "timestamp": 1729080000,
                "published_at": "2024-10-16T12:00:00Z",
                "like_count": 6800,
                "comment_count": 310,
                "view_count": 115000,
            },
            {
                "id": "cul_2",
                "shortcode": "CulW02",
                "permalink": "https://www.instagram.com/p/CulW02/",
                "caption": "How to make authentic salsa macha with chiles morita and toasted pumpkin seeds. Step-by-step card guide.",
                "media_type": ContentType.CAROUSEL,
                "timestamp": 1728880000,
                "published_at": "2024-10-14T04:26:40Z",
                "like_count": 5200,
                "comment_count": 280,
                "view_count": None,
            },
            {
                "id": "cul_3",
                "shortcode": "CulW03",
                "permalink": "https://www.instagram.com/p/CulW03/",
                "caption": "Morning espresso & cornetto ritual in Trastevere, Rome ☕️",
                "media_type": ContentType.IMAGE,
                "timestamp": 1728680000,
                "published_at": "2024-10-11T20:53:20Z",
                "like_count": 4400,
                "comment_count": 160,
                "view_count": None,
            },
        ],
    ),
}
