import aiohttp
import asyncio
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("steam_api")

class SteamAPI:
    BASE_URL = "https://api.steampowered.com"
    STORE_URL = "https://store.steampowered.com/api"

    def __init__(self, api_key: Optional[str] = None, steam_id: Optional[str] = None):
        self.api_key = api_key
        self.steam_id = steam_id
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self.session:
            await self.session.close()

    async def _get(self, url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Internal helper for GET requests with JSON parsing."""
        if not self.session:
            self.session = aiohttp.ClientSession()
        try:
            async with self.session.get(url, params=params, timeout=15) as resp:
                resp.raise_for_status()
                return await resp.json()
        except Exception as e:
            logger.error(f"Steam API request failed: {url} -> {e}")
            return None

    # ---------------------------
    # User & Games
    # ---------------------------

    async def get_player_summaries(self, steam_id: Optional[str] = None) -> Optional[Dict]:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/ISteamUser/GetPlayerSummaries/v2/",
            {"key": self.api_key, "steamids": steam_id},
        )

    async def get_owned_games(self, steam_id: Optional[str] = None) -> Optional[Dict]:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/IPlayerService/GetOwnedGames/v1/",
            {"key": self.api_key, "steamid": steam_id, "include_appinfo": True, "include_played_free_games": True},
        )

    async def get_recently_played_games(self, steam_id: Optional[str] = None) -> Optional[Dict]:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v1/",
            {"key": self.api_key, "steamid": steam_id},
        )

    # ---------------------------
    # Achievements & Stats
    # ---------------------------

    async def get_schema_for_game(self, app_id: int) -> Optional[Dict]:
        if not self.api_key:
            return None
        return await self._get(
            f"{self.BASE_URL}/ISteamUserStats/GetSchemaForGame/v2/",
            {"key": self.api_key, "appid": app_id},
        )

    async def get_player_achievements(self, app_id: int, steam_id: Optional[str] = None) -> Optional[Dict]:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/ISteamUserStats/GetPlayerAchievements/v1/",
            {"key": self.api_key, "steamid": steam_id, "appid": app_id},
        )

    async def get_global_achievements(self, app_id: int) -> Optional[Dict]:
        return await self._get(
            f"{self.BASE_URL}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/",
            {"gameid": app_id},
        )

    # ---------------------------
    # Store API (no key required)
    # ---------------------------

    async def get_app_details(self, app_id: int) -> Optional[Dict]:
        return await self._get(
            f"{self.STORE_URL}/appdetails",
            {"appids": app_id},
        )


# ---------------------------
# Quick test runner
# ---------------------------
if __name__ == "__main__":
    async def main():
        import os
        api_key = os.getenv("STEAM_API_KEY")
        steam_id = os.getenv("STEAM_ID")

        async with SteamAPI(api_key, steam_id) as api:
            details = await api.get_player_summaries()
            print("User details:", details)

            games = await api.get_owned_games()
            print("Owned games:", games)

            portal2 = await api.get_player_achievements(620)
            print("Portal 2 Achievements:", portal2)

    asyncio.run(main())
