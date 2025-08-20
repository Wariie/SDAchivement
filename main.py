"""
Steam Achievement Tracker Plugin for Decky Loader
Backend implementation with Steam API integration
"""

import os
import json
import asyncio
import logging
import aiohttp
import time
from typing import Dict, List, Optional, Any
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("AchievementTracker")

class Plugin:
    """
    Main plugin class for Steam Achievement Tracker
    """
    
    # Steam API endpoints
    STEAM_API_BASE = "https://api.steampowered.com"
    STEAM_STORE_API = "https://store.steampowered.com/api"
    
    async def _main(self):
        """Initialize the plugin"""
        logger.info("Steam Achievement Tracker initialized!")
        
        # Initialize cache and state
        self.plugin_dir = Path(os.path.dirname(__file__))
        self.cache_dir = self.plugin_dir / "cache"
        self.cache_dir.mkdir(exist_ok=True)
        
        self.settings_file = self.plugin_dir / "settings.json"
        self.steam_api_key = None
        self.current_user_id = None
        self.achievement_cache = {}
        self.last_cache_update = {}
        
        # Load settings
        await self.load_settings()
        
        # Get current Steam user
        await self.get_current_steam_user()
        
    async def _unload(self):
        """Cleanup when plugin is unloaded"""
        logger.info("Steam Achievement Tracker unloaded")
        
    async def _migration(self):
        """Handle plugin migrations"""
        logger.info("Running migrations...")
        # Migration logic if needed for updates
        
    # Settings management
    async def load_settings(self) -> Dict:
        """Load plugin settings"""
        try:
            if self.settings_file.exists():
                with open(self.settings_file, 'r') as f:
                    settings = json.load(f)
                    self.steam_api_key = settings.get('steam_api_key')
                    return settings
        except Exception as e:
            logger.error(f"Failed to load settings: {e}")
        return {}
    
    async def save_settings(self, settings: Dict) -> bool:
        """Save plugin settings"""
        try:
            self.settings_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.settings_file, 'w') as f:
                json.dump(settings, f, indent=2)
            
            # Update API key if changed
            if 'steam_api_key' in settings:
                self.steam_api_key = settings['steam_api_key']
            return True
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")
            return False
    
    async def set_steam_api_key(self, api_key: str) -> bool:
        """Set Steam API key"""
        settings = await self.load_settings()
        settings['steam_api_key'] = api_key
        return await self.save_settings(settings)
    
    # Steam user functions
    async def get_current_steam_user(self) -> Optional[str]:
        """Get current Steam user ID from system"""
        try:
            # Try to get from environment or Steam process
            # This is a simplified version - in production you'd want more robust detection
            steam_user = os.environ.get('STEAM_USER_ID')
            if not steam_user:
                # Try to read from Steam's loginusers.vdf
                steam_path = Path.home() / ".steam/steam/config/loginusers.vdf"
                if steam_path.exists():
                    with open(steam_path, 'r') as f:
                        content = f.read()
                        # Parse VDF to find most recent user
                        # Simplified parsing - you'd want a proper VDF parser
                        import re
                        matches = re.findall(r'"(\d{17})"', content)
                        if matches:
                            steam_user = matches[0]
            
            self.current_user_id = steam_user
            return steam_user
        except Exception as e:
            logger.error(f"Failed to get Steam user: {e}")
            return None
    
    # Game detection
    async def get_current_game(self) -> Optional[Dict]:
        """Get currently running game"""
        try:
            # Get the current app ID from Steam
            # This would interface with Steam's running processes
            # For now, we'll check the Steam registry/config
            result = await self._get_running_app_id()
            
            if result and result != 0:
                # Get game details
                game_info = await self.get_game_info(result)
                return {
                    "app_id": result,
                    "name": game_info.get("name", f"App {result}"),
                    "is_running": True,
                    "has_achievements": game_info.get("has_achievements", False),
                    "achievement_count": game_info.get("achievement_count", 0)
                }
        except Exception as e:
            logger.error(f"Failed to get current game: {e}")
        return None
    
    async def _get_running_app_id(self) -> Optional[int]:
        """Get the currently running Steam app ID"""
        try:
            # Check for environment variable set by Steam
            app_id = os.environ.get('SteamAppId')
            if app_id:
                return int(app_id)
            
            # Try to read from Steam's registry/config files
            # This is platform specific - simplified version
            steam_pid_file = Path("/tmp/.steam_exec_pid")
            if steam_pid_file.exists():
                # Parse the running game from Steam process
                # This would need more sophisticated parsing
                pass
                
        except Exception as e:
            logger.error(f"Failed to get running app ID: {e}")
        return None
    
    async def get_game_info(self, app_id: int) -> Dict:
        """Get game information from Steam"""
        try:
            # Check cache first
            cache_file = self.cache_dir / f"game_{app_id}.json"
            if cache_file.exists():
                cache_age = time.time() - cache_file.stat().st_mtime
                if cache_age < 86400:  # 24 hour cache
                    with open(cache_file, 'r') as f:
                        return json.load(f)
            
            # Fetch from Steam Store API
            async with aiohttp.ClientSession() as session:
                url = f"{self.STEAM_STORE_API}/appdetails?appids={app_id}"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if str(app_id) in data and data[str(app_id)]["success"]:
                            game_data = data[str(app_id)]["data"]
                            
                            # Extract relevant info
                            info = {
                                "app_id": app_id,
                                "name": game_data.get("name", ""),
                                "has_achievements": len(game_data.get("achievements", {}).get("total", 0)) > 0,
                                "achievement_count": game_data.get("achievements", {}).get("total", 0),
                                "header_image": game_data.get("header_image", ""),
                                "categories": [cat["description"] for cat in game_data.get("categories", [])]
                            }
                            
                            # Cache the result
                            with open(cache_file, 'w') as f:
                                json.dump(info, f)
                            
                            return info
        except Exception as e:
            logger.error(f"Failed to get game info for {app_id}: {e}")
        
        return {"app_id": app_id, "name": f"App {app_id}"}
    
    # Achievement functions
    async def get_achievements(self, app_id: int = None) -> Dict:
        """Get achievements for a game"""
        try:
            if not app_id:
                game = await self.get_current_game()
                if not game:
                    return {"error": "No game running"}
                app_id = game["app_id"]
            
            # Check cache
            cache_key = f"{app_id}_{self.current_user_id}"
            if cache_key in self.achievement_cache:
                cache_age = time.time() - self.last_cache_update.get(cache_key, 0)
                if cache_age < 300:  # 5 minute cache
                    return self.achievement_cache[cache_key]
            
            # Get both schema and player achievements
            schema = await self.get_achievement_schema(app_id)
            player_achievements = await self.get_player_achievements(app_id)
            global_stats = await self.get_global_achievement_stats(app_id)
            
            # Combine the data
            achievements_list = []
            total = 0
            unlocked = 0
            
            if schema and "achievements" in schema:
                for ach_schema in schema["achievements"]:
                    total += 1
                    achievement = {
                        "api_name": ach_schema["name"],
                        "display_name": ach_schema.get("displayName", ach_schema["name"]),
                        "description": ach_schema.get("description", ""),
                        "icon": ach_schema.get("icon", ""),
                        "icon_gray": ach_schema.get("icongray", ""),
                        "hidden": ach_schema.get("hidden", 0) == 1,
                        "unlocked": False,
                        "unlock_time": None,
                        "global_percent": None
                    }
                    
                    # Check if player has unlocked it
                    if player_achievements:
                        for player_ach in player_achievements:
                            if player_ach["apiname"] == ach_schema["name"] and player_ach["achieved"] == 1:
                                achievement["unlocked"] = True
                                achievement["unlock_time"] = player_ach.get("unlocktime", 0)
                                unlocked += 1
                                break
                    
                    # Add global stats
                    if global_stats:
                        for stat in global_stats:
                            if stat["name"] == ach_schema["name"]:
                                achievement["global_percent"] = stat.get("percent", 0)
                                break
                    
                    achievements_list.append(achievement)
            
            result = {
                "app_id": app_id,
                "total": total,
                "unlocked": unlocked,
                "percentage": round((unlocked / total * 100) if total > 0 else 0, 1),
                "achievements": achievements_list
            }
            
            # Update cache
            self.achievement_cache[cache_key] = result
            self.last_cache_update[cache_key] = time.time()
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get achievements for {app_id}: {e}")
            return {"error": str(e)}
    
    async def get_achievement_schema(self, app_id: int) -> Optional[Dict]:
        """Get achievement schema from Steam API"""
        if not self.steam_api_key:
            return None
            
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/"
                params = {
                    "key": self.steam_api_key,
                    "appid": app_id,
                    "l": "english"
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("game", {}).get("availableGameStats", {})
        except Exception as e:
            logger.error(f"Failed to get achievement schema: {e}")
        return None
    
    async def get_player_achievements(self, app_id: int) -> Optional[List]:
        """Get player's achievement progress"""
        if not self.steam_api_key or not self.current_user_id:
            return None
            
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/"
                params = {
                    "key": self.steam_api_key,
                    "steamid": self.current_user_id,
                    "appid": app_id,
                    "l": "english"
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("playerstats", {}).get("achievements", [])
        except Exception as e:
            logger.error(f"Failed to get player achievements: {e}")
        return None
    
    async def get_global_achievement_stats(self, app_id: int) -> Optional[List]:
        """Get global achievement completion percentages"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/"
                params = {"gameid": app_id}
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("achievementpercentages", {}).get("achievements", [])
        except Exception as e:
            logger.error(f"Failed to get global achievement stats: {e}")
        return None
    
    # Game statistics
    async def get_game_stats(self, app_id: int = None) -> Dict:
        """Get detailed game statistics"""
        try:
            if not app_id:
                game = await self.get_current_game()
                if not game:
                    return {"error": "No game running"}
                app_id = game["app_id"]
            
            if not self.steam_api_key or not self.current_user_id:
                return {"error": "Steam API key or user ID not configured"}
            
            async with aiohttp.ClientSession() as session:
                # Get user stats for game
                url = f"{self.STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/"
                params = {
                    "key": self.steam_api_key,
                    "steamid": self.current_user_id,
                    "appid": app_id
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        stats = data.get("playerstats", {}).get("stats", [])
                        
                        # Process stats into readable format
                        processed_stats = {}
                        for stat in stats:
                            processed_stats[stat["name"]] = stat["value"]
                        
                        return {
                            "app_id": app_id,
                            "stats": processed_stats
                        }
                        
        except Exception as e:
            logger.error(f"Failed to get game stats: {e}")
            
        return {"error": "Failed to retrieve stats"}
    
    # Recent achievements across all games
    async def get_recent_achievements(self, limit: int = 10) -> List[Dict]:
        """Get recently unlocked achievements across all games"""
        try:
            if not self.steam_api_key or not self.current_user_id:
                return []
            
            async with aiohttp.ClientSession() as session:
                # Get recently played games
                url = f"{self.STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/"
                params = {
                    "key": self.steam_api_key,
                    "steamid": self.current_user_id,
                    "count": 10
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        games = data.get("response", {}).get("games", [])
                        
                        recent_achievements = []
                        
                        # Check each game for recent achievements
                        for game in games:
                            achievements = await self.get_achievements(game["appid"])
                            if "achievements" in achievements:
                                for ach in achievements["achievements"]:
                                    if ach["unlocked"] and ach["unlock_time"]:
                                        recent_achievements.append({
                                            "game_name": game.get("name", f"App {game['appid']}"),
                                            "game_id": game["appid"],
                                            "achievement_name": ach["display_name"],
                                            "achievement_desc": ach["description"],
                                            "unlock_time": ach["unlock_time"],
                                            "icon": ach["icon"],
                                            "global_percent": ach.get("global_percent", 0)
                                        })
                        
                        # Sort by unlock time and return most recent
                        recent_achievements.sort(key=lambda x: x["unlock_time"], reverse=True)
                        return recent_achievements[:limit]
                        
        except Exception as e:
            logger.error(f"Failed to get recent achievements: {e}")
        
        return []
    
    # Achievement tracking
    async def get_achievement_progress(self) -> Dict:
        """Get overall achievement progress across all games"""
        try:
            if not self.steam_api_key or not self.current_user_id:
                return {"error": "Not configured"}
            
            async with aiohttp.ClientSession() as session:
                # Get owned games
                url = f"{self.STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/"
                params = {
                    "key": self.steam_api_key,
                    "steamid": self.current_user_id,
                    "include_appinfo": True,
                    "include_played_free_games": True
                }
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        games = data.get("response", {}).get("games", [])
                        
                        total_achievements = 0
                        unlocked_achievements = 0
                        perfect_games = []
                        games_with_achievements = 0
                        
                        for game in games:
                            if game.get("has_community_visible_stats"):
                                achievements = await self.get_achievements(game["appid"])
                                if "total" in achievements and achievements["total"] > 0:
                                    games_with_achievements += 1
                                    total_achievements += achievements["total"]
                                    unlocked_achievements += achievements["unlocked"]
                                    
                                    if achievements["unlocked"] == achievements["total"]:
                                        perfect_games.append({
                                            "name": game.get("name", f"App {game['appid']}"),
                                            "app_id": game["appid"],
                                            "achievements": achievements["total"]
                                        })
                        
                        return {
                            "total_games": len(games),
                            "games_with_achievements": games_with_achievements,
                            "total_achievements": total_achievements,
                            "unlocked_achievements": unlocked_achievements,
                            "average_completion": round((unlocked_achievements / total_achievements * 100) if total_achievements > 0 else 0, 1),
                            "perfect_games": perfect_games,
                            "perfect_games_count": len(perfect_games)
                        }
                        
        except Exception as e:
            logger.error(f"Failed to get achievement progress: {e}")
        
        return {"error": "Failed to calculate progress"}
    
    # Utility functions
    async def refresh_cache(self, app_id: int = None) -> bool:
        """Force refresh cache for a game or all games"""
        try:
            if app_id:
                cache_key = f"{app_id}_{self.current_user_id}"
                if cache_key in self.achievement_cache:
                    del self.achievement_cache[cache_key]
                if cache_key in self.last_cache_update:
                    del self.last_cache_update[cache_key]
            else:
                self.achievement_cache.clear()
                self.last_cache_update.clear()
            
            logger.info(f"Cache refreshed for {app_id or 'all games'}")
            return True
        except Exception as e:
            logger.error(f"Failed to refresh cache: {e}")
            return False