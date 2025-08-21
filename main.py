"""
Steam Achievement Tracker Plugin for Decky Loader
Full implementation with Steam API integration
"""
import decky
import os
import json
import asyncio
import aiohttp
import time
import subprocess
import re
import traceback
from typing import Dict, List, Optional, Any
from pathlib import Path

# Setup logging
log_file = os.path.join(decky.DECKY_PLUGIN_LOG_DIR, "achievement_tracker.log")
os.makedirs(os.path.dirname(log_file), exist_ok=True)

def log(level: str, message: str):
    """Simple file logger with levels"""
    try:
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        with open(log_file, 'a') as f:
            f.write(f"[{timestamp}] [{level}] {message}\n")
    except:
        pass

class Plugin:
    """
    Main plugin class for Steam Achievement Tracker
    """
    
    # Steam API endpoints
    STEAM_API_BASE = "https://api.steampowered.com"
    STEAM_STORE_API = "https://store.steampowered.com/api"

    def __init__(self):
        # Initialize paths right away so they're available in migration, unload, etc.
        self.plugin_dir = Path(decky.DECKY_PLUGIN_DIR)
        self.settings_dir = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)
        self.cache_dir = Path(decky.DECKY_PLUGIN_RUNTIME_DIR) / "cache"
        self.settings_file = self.settings_dir / "settings.json"

        # Initialize state
        self.steam_api_key = None
        self.current_user_id = None
        self.test_app_id = None
        self.achievement_cache = {}
        self.last_cache_update = {}
    
    async def _main(self):
        """Initialize the plugin"""
        try:
            log("INFO", "=== Steam Achievement Tracker Starting ===")

            # Make sure directories exist
            self.settings_dir.mkdir(parents=True, exist_ok=True)
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            
            log("INFO", f"Settings directory: {self.settings_dir}")
            log("INFO", f"Cache directory: {self.cache_dir}")
            
            # Load settings
            await self.load_settings()
            
            # Try to get current Steam user
            await self.get_current_steam_user()
            
            log("INFO", f"Steam API Key configured: {bool(self.steam_api_key)}")
            log("INFO", f"Steam User ID: {self.current_user_id}")
            log("INFO", "=== Plugin initialized successfully ===")
            
        except Exception as e:
            log("ERROR", f"Failed to initialize: {str(e)}")
            log("ERROR", traceback.format_exc())
    
    async def _unload(self):
        """Cleanup when plugin is unloaded"""
        log("INFO", "Steam Achievement Tracker unloading")
        # Clear cache on unload
        self.achievement_cache.clear()
        self.last_cache_update.clear()
    
    async def _migration(self):
        """Handle plugin migrations"""
        log("INFO", "Running migrations...")
        
        # Migrate old settings if they exist
        old_settings_path = self.plugin_dir / "settings.json"
        if old_settings_path.exists() and not self.settings_file.exists():
            log("INFO", f"Migrating settings from {old_settings_path}")
            try:
                import shutil
                shutil.move(str(old_settings_path), str(self.settings_file))
                log("INFO", "Settings migration completed")
            except Exception as e:
                log("ERROR", f"Failed to migrate settings: {e}")
    
    # ==================== Settings Management ====================
    
    async def load_settings(self) -> Dict:
        """Load plugin settings"""
        try:
            if self.settings_file.exists():
                with open(self.settings_file, 'r') as f:
                    settings = json.load(f)
                    self.steam_api_key = settings.get('steam_api_key')
                    self.current_user_id = settings.get('steam_user_id')
                    self.test_app_id = settings.get('test_app_id')
                    log("INFO", "Settings loaded successfully")
                    return settings
            else:
                log("INFO", "No settings file found, using defaults")
                return {}
        except Exception as e:
            log("ERROR", f"Failed to load settings: {e}")
            return {}
    
    async def save_settings(self, settings: Dict) -> bool:
        """Save plugin settings"""
        try:
            # Ensure directory exists
            self.settings_dir.mkdir(parents=True, exist_ok=True)
            
            # Save settings
            with open(self.settings_file, 'w') as f:
                json.dump(settings, f, indent=2)
            
            log("INFO", "Settings saved successfully")
            return True
        except Exception as e:
            log("ERROR", f"Failed to save settings: {e}")
            return False
    
    async def set_steam_api_key(self, api_key: str) -> bool:
        """Set Steam API key"""
        try:
            log("INFO", "Setting Steam API key")
            
            # Load current settings
            settings = await self.load_settings()
            
            # Update API key
            settings['steam_api_key'] = api_key
            self.steam_api_key = api_key
            
            # Save settings
            success = await self.save_settings(settings)
            
            if success:
                # Clear cache when API key changes
                self.achievement_cache.clear()
                self.last_cache_update.clear()
                log("INFO", "Steam API key saved and cache cleared")
            
            return success
        except Exception as e:
            log("ERROR", f"Failed to set API key: {e}")
            return False
    
    async def set_steam_user_id(self, user_id: str) -> bool:
        """Manually set Steam user ID"""
        try:
            log("INFO", f"Setting Steam user ID: {user_id}")
            
            # Validate Steam ID format (17 digits starting with 7656)
            if not re.match(r'^7656\d{13}$', user_id):
                log("ERROR", f"Invalid Steam ID format: {user_id}")
                return False
            
            # Load current settings
            settings = await self.load_settings()
            
            # Update user ID
            settings['steam_user_id'] = user_id
            self.current_user_id = user_id
            
            # Save settings
            success = await self.save_settings(settings)
            
            if success:
                # Clear cache when user changes
                self.achievement_cache.clear()
                self.last_cache_update.clear()
                log("INFO", "Steam user ID saved and cache cleared")
            
            return success
        except Exception as e:
            log("ERROR", f"Failed to set Steam user ID: {e}")
            return False
    
    async def set_test_game(self, app_id: int) -> bool:
        """Manually set a game ID for testing"""
        try:
            log("INFO", f"Setting test game ID: {app_id}")
            
            self.test_app_id = app_id
            
            # Save to settings
            settings = await self.load_settings()
            settings['test_app_id'] = app_id
            success = await self.save_settings(settings)
            
            return success
        except Exception as e:
            log("ERROR", f"Failed to set test game: {e}")
            return False
    
    # ==================== Steam User Functions ====================
    
    async def get_current_steam_user(self) -> Optional[str]:
        """Get current Steam user ID from system"""
        try:
            # Method 1: Try to get from stored settings
            if self.current_user_id:
                log("INFO", f"Using saved Steam user ID: {self.current_user_id}")
                return self.current_user_id
            
            # Method 2: Try environment variable
            steam_user = os.environ.get('STEAM_USER_ID')
            if steam_user:
                log("INFO", f"Found Steam user ID from environment: {steam_user}")
                await self.set_steam_user_id(steam_user)
                return steam_user
            
            # Method 3: Try to read from Steam's loginusers.vdf
            steam_configs = [
                Path(decky.DECKY_USER_HOME) / ".steam/steam/config/loginusers.vdf",
                Path(decky.DECKY_USER_HOME) / ".local/share/Steam/config/loginusers.vdf",
                Path("/home/deck/.local/share/Steam/config/loginusers.vdf"),
                Path("/home/deck/.steam/steam/config/loginusers.vdf")
            ]
            
            for steam_path in steam_configs:
                if steam_path.exists():
                    try:
                        with open(steam_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            # Look for Steam ID pattern
                            matches = re.findall(r'"(7656\d{13})"', content)
                            if matches:
                                steam_user = matches[0]
                                log("INFO", f"Found Steam user ID from config: {steam_user}")
                                await self.set_steam_user_id(steam_user)
                                return steam_user
                    except Exception as e:
                        log("WARNING", f"Failed to read {steam_path}: {e}")
            
            log("WARNING", "No Steam user ID found")
            return None
            
        except Exception as e:
            log("ERROR", f"Failed to get Steam user: {e}")
            return None
    
    # ==================== Game Detection ====================
    
    async def get_current_game(self) -> Optional[Dict]:
        """Get currently running game"""
        try:
            # Check if we have a test game ID set
            if self.test_app_id:
                log("INFO", f"Using test game ID: {self.test_app_id}")
                game_info = await self.get_game_info(self.test_app_id)
                return {
                    "app_id": self.test_app_id,
                    "name": game_info.get("name", f"App {self.test_app_id}"),
                    "is_running": True,
                    "has_achievements": game_info.get("has_achievements", False),
                    "achievement_count": game_info.get("achievement_count", 0)
                }
            
            # Get the current app ID from Steam
            app_id = await self._get_running_app_id()
            
            if app_id and app_id != 0:
                # Get game details
                game_info = await self.get_game_info(app_id)
                return {
                    "app_id": app_id,
                    "name": game_info.get("name", f"App {app_id}"),
                    "is_running": True,
                    "has_achievements": game_info.get("has_achievements", False),
                    "achievement_count": game_info.get("achievement_count", 0)
                }
            
            log("INFO", "No game currently running")
            return None
            
        except Exception as e:
            log("ERROR", f"Failed to get current game: {e}")
            return None
    
    async def _get_running_app_id(self) -> Optional[int]:
        """Get the currently running Steam app ID"""
        try:
            # Method 1: Check for SteamAppId environment variable
            app_id = os.environ.get('SteamAppId')
            if app_id and app_id != "0":
                log("INFO", f"Found app ID from environment: {app_id}")
                return int(app_id)
            
            # Method 2: Check Steam overlay file
            overlay_file = Path("/dev/shm/SteamOverlayAppId")
            if overlay_file.exists():
                try:
                    with open(overlay_file, 'r') as f:
                        app_id = f.read().strip()
                        if app_id and app_id != "0":
                            log("INFO", f"Found app ID from overlay: {app_id}")
                            return int(app_id)
                except:
                    pass
            
            # Method 3: Check for running Steam game processes
            try:
                result = subprocess.run(['pgrep', '-f', 'reaper.*AppId='], 
                                      capture_output=True, text=True, timeout=5)
                if result.stdout:
                    match = re.search(r'AppId=(\d+)', result.stdout)
                    if match:
                        app_id = match.group(1)
                        log("INFO", f"Found app ID from process: {app_id}")
                        return int(app_id)
            except:
                pass
            
            # Method 4: Check Steam registry
            registry_file = Path(decky.DECKY_USER_HOME) / ".steam/registry.vdf"
            if registry_file.exists():
                try:
                    with open(registry_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        match = re.search(r'"RunningAppID"\s+"(\d+)"', content)
                        if match:
                            app_id = match.group(1)
                            if app_id != "0":
                                log("INFO", f"Found app ID from registry: {app_id}")
                                return int(app_id)
                except:
                    pass
            
            return None
            
        except Exception as e:
            log("ERROR", f"Failed to get running app ID: {e}")
            return None
    
    async def get_game_info(self, app_id: int) -> Dict:
        """Get game information from Steam Store API"""
        try:
            # Check cache first
            cache_file = self.cache_dir / f"game_{app_id}.json"
            if cache_file.exists():
                cache_age = time.time() - cache_file.stat().st_mtime
                if cache_age < 86400:  # 24 hour cache
                    with open(cache_file, 'r') as f:
                        return json.load(f)
            
            # Fetch from Steam Store API (no API key needed)
            async with aiohttp.ClientSession() as session:
                url = f"{self.STEAM_STORE_API}/appdetails?appids={app_id}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        if str(app_id) in data and data[str(app_id)]["success"]:
                            game_data = data[str(app_id)]["data"]
                            
                            # Extract relevant info
                            info = {
                                "app_id": app_id,
                                "name": game_data.get("name", ""),
                                "has_achievements": game_data.get("achievements", {}).get("total", 0) > 0,
                                "achievement_count": game_data.get("achievements", {}).get("total", 0),
                                "header_image": game_data.get("header_image", ""),
                                "categories": [cat["description"] for cat in game_data.get("categories", [])]
                            }
                            
                            # Cache the result
                            with open(cache_file, 'w') as f:
                                json.dump(info, f)
                            
                            return info
        except Exception as e:
            log("ERROR", f"Failed to get game info for {app_id}: {e}")
        
        return {"app_id": app_id, "name": f"App {app_id}", "has_achievements": False}
    
    # ==================== Achievement Functions ====================
    
    async def get_achievements(self, app_id: int = None) -> Dict:
        """Get achievements for a game"""
        try:
            if not app_id:
                game = await self.get_current_game()
                if not game:
                    return {"error": "No game running. Set a test game in Settings."}
                app_id = game["app_id"]
            
            log("INFO", f"Getting achievements for app {app_id}")
            
            # Check if we have required configuration
            if not self.steam_api_key:
                log("WARNING", "No Steam API key configured")
                return {"error": "Steam API key not configured. Add it in Settings."}
            
            if not self.current_user_id:
                log("WARNING", "No Steam user ID found")
                return {"error": "Steam User ID not found. Add it in Settings."}
            
            # Check cache
            cache_key = f"{app_id}_{self.current_user_id}"
            if cache_key in self.achievement_cache:
                cache_age = time.time() - self.last_cache_update.get(cache_key, 0)
                if cache_age < 300:  # 5 minute cache
                    log("INFO", f"Returning cached achievements for {app_id}")
                    return self.achievement_cache[cache_key]
            
            # Get achievement data
            schema = await self.get_achievement_schema(app_id)
            player_achievements = await self.get_player_achievements(app_id)
            global_stats = await self.get_global_achievement_stats(app_id)
            
            # Check if we got the schema
            if not schema or "achievements" not in schema:
                log("WARNING", f"No achievement schema found for app {app_id}")
                return {"error": f"No achievements found for app {app_id}. Game might not have achievements."}
            
            # Combine the data
            achievements_list = []
            total = 0
            unlocked = 0
            
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
            
            log("INFO", f"Retrieved {total} achievements for app {app_id} ({unlocked} unlocked)")
            return result
            
        except Exception as e:
            log("ERROR", f"Failed to get achievements for {app_id}: {e}")
            return {"error": f"Failed to get achievements: {str(e)}"}
    
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
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        game_data = data.get("game", {})
                        if game_data:
                            stats = game_data.get("availableGameStats", {})
                            if stats and "achievements" in stats:
                                log("INFO", f"Found {len(stats['achievements'])} achievements in schema for app {app_id}")
                            return stats
                    elif response.status == 403:
                        log("ERROR", "API key is invalid or has no permissions")
                    else:
                        log("ERROR", f"Schema API returned status {response.status}")
        except asyncio.TimeoutError:
            log("ERROR", f"Timeout getting achievement schema for app {app_id}")
        except Exception as e:
            log("ERROR", f"Failed to get achievement schema: {e}")
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
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "playerstats" in data:
                            achievements = data.get("playerstats", {}).get("achievements", [])
                            log("INFO", f"Found {len(achievements)} player achievements for app {app_id}")
                            return achievements
        except Exception as e:
            log("ERROR", f"Failed to get player achievements: {e}")
        return None
    
    async def get_global_achievement_stats(self, app_id: int) -> Optional[List]:
        """Get global achievement completion percentages"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/"
                params = {"gameid": app_id}
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("achievementpercentages", {}).get("achievements", [])
        except Exception as e:
            log("ERROR", f"Failed to get global achievement stats: {e}")
        return None
    
    # ==================== Game Statistics ====================
    
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
            
            log("INFO", f"Getting game stats for app {app_id}")
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/"
                params = {
                    "key": self.steam_api_key,
                    "steamid": self.current_user_id,
                    "appid": app_id
                }
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
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
            log("ERROR", f"Failed to get game stats: {e}")
            
        return {"error": "Failed to retrieve stats"}
    
    # ==================== Recent Achievements ====================
    
    async def get_recent_achievements(self, limit: int = 10) -> List[Dict]:
        """Get recently unlocked achievements across all games"""
        try:
            if not self.steam_api_key or not self.current_user_id:
                log("WARNING", "Missing API key or user ID for recent achievements")
                return []
            
            log("INFO", f"Getting recent achievements (limit: {limit})")
            
            async with aiohttp.ClientSession() as session:
                # Get recently played games
                url = f"{self.STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/"
                params = {
                    "key": self.steam_api_key,
                    "steamid": self.current_user_id,
                    "count": 10
                }
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        games = data.get("response", {}).get("games", [])
                        
                        recent_achievements = []
                        
                        # Check each game for recent achievements
                        for game in games[:5]:  # Limit to 5 games for performance
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
            log("ERROR", f"Failed to get recent achievements: {e}")
        
        return []
    
    # ==================== Overall Progress ====================
    
    async def get_achievement_progress(self) -> Dict:
        """Get overall achievement progress across all games"""
        try:
            if not self.steam_api_key or not self.current_user_id:
                return {"error": "Not configured"}
            
            log("INFO", "Getting overall achievement progress")
            
            async with aiohttp.ClientSession() as session:
                # Get owned games
                url = f"{self.STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/"
                params = {
                    "key": self.steam_api_key,
                    "steamid": self.current_user_id,
                    "include_appinfo": True,
                    "include_played_free_games": True
                }
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        games = data.get("response", {}).get("games", [])
                        
                        total_achievements = 0
                        unlocked_achievements = 0
                        perfect_games = []
                        games_with_achievements = 0
                        
                        # Limit to first 10 games for performance
                        games_to_check = min(10, len(games))
                        for game in games[:games_to_check]:
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
                        
                        log("INFO", f"Progress calculated: {unlocked_achievements}/{total_achievements} achievements")
                        
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
            log("ERROR", f"Failed to get achievement progress: {e}")
        
        return {"error": "Failed to calculate progress"}
    
    # ==================== Utility Functions ====================
    
    async def refresh_cache(self, app_id: int = None) -> bool:
        """Force refresh cache for a game or all games"""
        try:
            if app_id:
                cache_key = f"{app_id}_{self.current_user_id}"
                if cache_key in self.achievement_cache:
                    del self.achievement_cache[cache_key]
                if cache_key in self.last_cache_update:
                    del self.last_cache_update[cache_key]
                log("INFO", f"Cache refreshed for app {app_id}")
            else:
                self.achievement_cache.clear()
                self.last_cache_update.clear()
                log("INFO", "All cache cleared")
            
            return True
        except Exception as e:
            log("ERROR", f"Failed to refresh cache: {e}")
            return False
    
    async def get_log_content(self, lines: int = 100) -> str:
        """Get the last N lines of the log file for debugging"""
        try:
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    all_lines = f.readlines()
                    return ''.join(all_lines[-lines:])
            return "No log file found"
        except Exception as e:
            return f"Error reading log: {str(e)}"