"""Persistence layer for saved creators and analysis history using SQLite."""

import datetime
import os
import sqlite3
import threading
from typing import Any, Dict, List, Optional

DB_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "creatorscope.db",
)


class StorageService:
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS saved_creators (
                        username TEXT PRIMARY KEY,
                        full_name TEXT,
                        profile_pic_url TEXT,
                        follower_count INTEGER,
                        engagement_rate REAL,
                        notes TEXT,
                        tags TEXT,
                        saved_at TEXT NOT NULL
                    )
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS analysis_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT NOT NULL,
                        followers INTEGER,
                        posts_analyzed INTEGER,
                        engagement_rate REAL,
                        is_mock INTEGER NOT NULL,
                        analyzed_at TEXT NOT NULL
                    )
                    """
                )
                conn.commit()

    def save_creator(
        self,
        username: str,
        full_name: Optional[str] = None,
        profile_pic_url: Optional[str] = None,
        follower_count: Optional[int] = None,
        engagement_rate: Optional[float] = None,
        notes: Optional[str] = None,
        tags: Optional[str] = None,
    ) -> Dict[str, Any]:
        username_clean = username.lower().strip()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO saved_creators (username, full_name, profile_pic_url, follower_count, engagement_rate, notes, tags, saved_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(username) DO UPDATE SET
                        full_name=excluded.full_name,
                        profile_pic_url=excluded.profile_pic_url,
                        follower_count=excluded.follower_count,
                        engagement_rate=excluded.engagement_rate,
                        notes=COALESCE(excluded.notes, saved_creators.notes),
                        tags=COALESCE(excluded.tags, saved_creators.tags),
                        saved_at=excluded.saved_at
                    """,
                    (
                        username_clean,
                        full_name,
                        profile_pic_url,
                        follower_count,
                        engagement_rate,
                        notes or "",
                        tags or "",
                        now,
                    ),
                )
                conn.commit()
        return {
            "username": username_clean,
            "full_name": full_name,
            "profile_pic_url": profile_pic_url,
            "follower_count": follower_count,
            "engagement_rate": engagement_rate,
            "notes": notes or "",
            "tags": tags or "",
            "saved_at": now,
        }

    def remove_saved_creator(self, username: str) -> bool:
        username_clean = username.lower().strip()
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM saved_creators WHERE username = ?", (username_clean,))
                conn.commit()
                return cursor.rowcount > 0

    def list_saved_creators(self) -> List[Dict[str, Any]]:
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT username, full_name, profile_pic_url, follower_count, engagement_rate, notes, tags, saved_at FROM saved_creators ORDER BY saved_at DESC"
                )
                rows = cursor.fetchall()
                return [dict(r) for r in rows]

    def is_saved(self, username: str) -> bool:
        username_clean = username.lower().strip()
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT 1 FROM saved_creators WHERE username = ? LIMIT 1", (username_clean,)
                )
                return cursor.fetchone() is not None

    def record_analysis(
        self,
        username: str,
        followers: Optional[int],
        posts_analyzed: int,
        engagement_rate: Optional[float],
        is_mock: bool,
    ):
        username_clean = username.lower().strip()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO analysis_history (username, followers, posts_analyzed, engagement_rate, is_mock, analyzed_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        username_clean,
                        followers,
                        posts_analyzed,
                        engagement_rate,
                        1 if is_mock else 0,
                        now,
                    ),
                )
                conn.commit()

    def list_recent_analyses(self, limit: int = 10) -> List[Dict[str, Any]]:
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT username, followers, posts_analyzed, engagement_rate, is_mock, analyzed_at
                    FROM analysis_history
                    ORDER BY id DESC
                    LIMIT ?
                    """,
                    (limit,),
                )
                rows = cursor.fetchall()
                return [
                    {
                        "username": r["username"],
                        "followers": r["followers"],
                        "posts_analyzed": r["posts_analyzed"],
                        "engagement_rate": r["engagement_rate"],
                        "is_mock": bool(r["is_mock"]),
                        "analyzed_at": r["analyzed_at"],
                    }
                    for r in rows
                ]


storage_service = StorageService()
