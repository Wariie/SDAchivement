import aiohttp
import logging
import json
import time
import decky
from pathlib import Path
from typing import Optional, Dict, Any, List
import ssl

logger = decky.logger

class SteamAPI:
    BASE_URL = "https://api.steampowered.com"
    STORE_URL = "https://store.steampowered.com/api"

    def __init__(self, api_key: Optional[str] = None, steam_id: Optional[str] = None, cache_dir: Optional[Path] = None):
        self.api_key = api_key
        self.steam_id = steam_id
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache_dir = cache_dir or Path("/tmp/steam_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Create SSL context that doesn't verify certificates
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE

    async def __aenter__(self):
        connector = aiohttp.TCPConnector(ssl=self.ssl_context)
        self.session = aiohttp.ClientSession(connector=connector)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self.session:
            await self.session.close()

    async def _ensure_session(self):
        if not self.session:
            connector = aiohttp.TCPConnector(ssl=self.ssl_context)
            self.session = aiohttp.ClientSession(connector=connector)

    async def _get(self, url: str, params: Dict[str, Any]) -> Dict[str, Any] | None:
        await self._ensure_session()
        try:
            async with self.session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    logger.error(f"Steam API returned status {resp.status} for {url}")
                    return None
        except Exception as e:
            logger.error(f"Steam API request failed: {url} -> {e}")
            return None

    async def close(self):
        if self.session:
            await self.session.close()
            self.session = None

    # ---------------------------
    # User & Games
    # ---------------------------

    async def get_player_summaries(self, steam_id: Optional[str] = None) -> Dict | None:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/ISteamUser/GetPlayerSummaries/v2/",
            {"key": self.api_key, "steamids": steam_id},
        )

    async def get_owned_games(self, steam_id: Optional[str] = None) -> Dict | None:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/IPlayerService/GetOwnedGames/v1/",
            {"key": self.api_key, "steamid": steam_id, "include_appinfo": "1", "include_played_free_games": "1", "skip_unvetted_apps": "false"},
        )

    async def get_recently_played_games(self, steam_id: Optional[str] = None) -> Dict | None:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v1/",
            {"key": self.api_key, "steamid": steam_id, "count": 10},
        )

    async def get_recent_achievements(self, limit: int = 10) -> List[Dict]:
        """Get recently unlocked achievements across all games"""
        try:
            if not self.api_key or not self.steam_id:
                logger.warning("Missing API key or steam ID for recent achievements")
                return []

            # Get recently played games
            response = await self.get_recently_played_games()
            if not response:
                return []

            games = response.get("response", {}).get("games", [])
            recent_achievements = []

            # Check each game for recent achievements
            for game in games[:5]:  # Limit to 5 games for performance
                achievements_data = await self.get_player_achievements(game["appid"])
                if achievements_data and "achievements" in achievements_data:
                    for ach in achievements_data["achievements"]:
                        if ach["unlocked"] and ach["unlock_time"]:
                            # Ensure global_percent is a proper number
                            global_percent = ach.get("global_percent")
                            if global_percent is not None:
                                try:
                                    global_percent = float(global_percent)
                                except (ValueError, TypeError):
                                    global_percent = 0.0
                            else:
                                global_percent = 0.0
                                
                            recent_achievements.append({
                                "game_name": game.get("name", f"App {game['appid']}"),
                                "game_id": game["appid"],
                                "achievement_name": ach["display_name"],
                                "achievement_desc": ach["description"],
                                "unlock_time": ach["unlock_time"],
                                "icon": ach["icon"],
                                "global_percent": global_percent
                            })

            # Sort by unlock time and return most recent
            recent_achievements.sort(key=lambda x: x["unlock_time"], reverse=True)
            return recent_achievements[:limit]

        except Exception as e:
            logger.error(f"Failed to get recent achievements: {e}")
            return []

    # ---------------------------
    # Achievements & Stats
    # ---------------------------

    async def get_schema_for_game(self, app_id: int) -> Optional[Dict]:
        if not self.api_key:
            return None
        return await self._get(
            f"{self.BASE_URL}/ISteamUserStats/GetSchemaForGame/v2/",
            {"key": self.api_key, "appid": app_id, "l": "english"},
        )

    async def get_player_achievements_raw(self, app_id: int, steam_id: Optional[str] = None) -> Optional[Dict]:
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/ISteamUserStats/GetPlayerAchievements/v1/",
            {"key": self.api_key, "steamid": steam_id, "appid": app_id, "l": "english"},
        )

    async def get_player_achievements(self, app_id: int, steam_id: Optional[str] = None) -> Optional[Dict]:
        """Get formatted achievement data for a player"""
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return {"error": "Missing API key or Steam ID"}

        try:
            # Get all the required data
            schema = await self.get_schema_for_game(app_id)
            player = await self.get_player_achievements_raw(app_id, steam_id)
            global_stats = await self.get_global_achievements(app_id)

            if not schema:
                return {"error": "Failed to fetch achievement schema"}
            
            if not player:
                return {"error": "Failed to fetch player achievements"}

            # Parse schema achievements
            schema_achs = {}
            game_data = schema.get("game", {})
            if game_data:
                available_stats = game_data.get("availableGameStats", {})
                if available_stats and "achievements" in available_stats:
                    schema_achs = {a["name"]: a for a in available_stats["achievements"]}

            # Parse player achievements
            player_achs = {}
            playerstats = player.get("playerstats", {})
            if playerstats and "achievements" in playerstats:
                player_achs = {a["apiname"]: a for a in playerstats["achievements"]}

            # Parse global achievements
            global_achs = {}
            if global_stats:
                global_achievement_data = global_stats.get("achievementpercentages", {})
                if global_achievement_data and "achievements" in global_achievement_data:
                    global_achs = {a["name"]: a["percent"] for a in global_achievement_data["achievements"]}

            # Validate that we have achievements data
            if not schema_achs:
                logger.warning(f"No achievements found in schema for app {app_id}")
                return {
                    "app_id": app_id,
                    "total": 0,
                    "unlocked": 0,
                    "percentage": 0.0,
                    "achievements": [],
                    "error": "No achievements found for this game"
                }

            achievements: List[Dict[str, Any]] = []
            unlocked_count = 0

            # Combine all data
            for api_name, sch in schema_achs.items():
                pl = player_achs.get(api_name, {})
                unlocked = pl.get("achieved", 0) == 1
                if unlocked:
                    unlocked_count += 1

                # Ensure global_percent is a proper number or null
                global_percent = global_achs.get(api_name)
                if global_percent is not None:
                    try:
                        global_percent = float(global_percent)
                    except (ValueError, TypeError):
                        global_percent = None

                achievements.append({
                    "api_name": api_name,
                    "display_name": sch.get("displayName", api_name),
                    "description": sch.get("description", ""),
                    "icon": sch.get("icon", ""),
                    "icon_gray": sch.get("icongray", ""),
                    "hidden": sch.get("hidden", 0) == 1,
                    "unlocked": unlocked,
                    "unlock_time": pl.get("unlocktime"),
                    "global_percent": global_percent
                })

            total = len(achievements)
            percentage = round((unlocked_count / total) * 100, 2) if total > 0 else 0.0

            result = {
                "app_id": app_id,
                "total": int(total),  # Ensure these are integers
                "unlocked": int(unlocked_count),
                "percentage": float(percentage),  # Ensure this is a float
                "achievements": achievements
            }
            
            logger.info(f"Achievement data for app {app_id}: {unlocked_count}/{total} ({percentage}%)")
            return result

        except Exception as e:
            logger.error(f"Failed to get player achievements for app {app_id}: {e}")
            return {"error": f"Failed to fetch achievement data: {str(e)}"}

    async def get_global_achievements(self, app_id: int) -> Optional[Dict]:
        """Get global achievement percentages"""
        return await self._get(
            f"{self.BASE_URL}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/",
            {"gameid": app_id},
        )

    async def get_user_stats_for_game(self, app_id: int, steam_id: Optional[str] = None) -> Optional[Dict]:
        """Get user statistics for a game"""
        steam_id = steam_id or self.steam_id
        if not self.api_key or not steam_id:
            return None
        return await self._get(
            f"{self.BASE_URL}/ISteamUserStats/GetUserStatsForGame/v2/",
            {"key": self.api_key, "steamid": steam_id, "appid": app_id},
        )

    # ---------------------------
    # Store API (no key required)
    # ---------------------------

    async def get_app_details(self, app_id: int) -> Dict | None:
        """Get game details from Steam Store API"""
        try:
            # Check cache first
            cache_file = self.cache_dir / f"game_{app_id}.json"
            if cache_file.exists():
                cache_age = time.time() - cache_file.stat().st_mtime
                if cache_age < 86400:  # 24 hour cache
                    return json.loads(cache_file.read_text())

            await self._ensure_session()
            url = f"{self.STORE_URL}/appdetails"
            params = {"appids": app_id}
            
            async with self.session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    if str(app_id) in data and data[str(app_id)]["success"]:
                        game_data = data[str(app_id)]["data"]
                        info = {
                            "app_id": app_id,
                            "name": game_data.get("name", ""),
                            "has_achievements": game_data.get("achievements", {}).get("total", 0) > 0,
                            "achievement_count": game_data.get("achievements", {}).get("total", 0),
                            "header_image": game_data.get("header_image", ""),
                            "categories": [cat.get("description", "") for cat in game_data.get("categories", [])]
                        }
                        
                        # Cache the result
                        try:
                            cache_file.write_text(json.dumps(info))
                        except Exception as e:
                            logger.warning(f"Failed to cache app details: {e}")
                        
                        return info
                        
        except Exception as e:
            logger.error(f"Failed to get app details for {app_id}: {e}")
        
        return {"app_id": app_id, "name": f"App {app_id}", "has_achievements": False, "achievement_count": 0}