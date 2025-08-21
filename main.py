"""
Steam Achievement Tracker Plugin for Decky Loader
Full implementation with Steam API integration and smart caching
"""
import decky
import os
import json
import asyncio
import time
import subprocess
import re
import traceback
from typing import Dict, List, Optional, Any
from pathlib import Path

from steam_api import SteamAPI  # custom wrapper

def validate_achievement_data(data: Dict) -> Dict:
    """Ensure achievement data has correct types for frontend"""
    try:
        # Ensure numeric fields are proper integers/floats
        validated = {
            "app_id": int(data.get("app_id", 0)),
            "total": int(data.get("total", 0)),
            "unlocked": int(data.get("unlocked", 0)),
            "percentage": float(data.get("percentage", 0.0)),
            "achievements": data.get("achievements", [])
        }
        
        # Add any error from original data
        if "error" in data:
            validated["error"] = data["error"]
            
        decky.logger.debug(f"Validated achievement data: {validated['unlocked']}/{validated['total']} ({validated['percentage']}%)")
        return validated
        
    except Exception as e:
        decky.logger.error(f"Failed to validate achievement data: {e}")
        return {
            "app_id": 0,
            "total": 0,
            "unlocked": 0,
            "percentage": 0.0,
            "achievements": [],
            "error": f"Data validation failed: {str(e)}"
        }

def validate_progress_data(data: Dict) -> Dict:
    """Ensure overall progress data has correct types for frontend"""
    try:
        validated = {
            "total_games": int(data.get("total_games", 0)),
            "games_with_achievements": int(data.get("games_with_achievements", 0)),
            "total_achievements": int(data.get("total_achievements", 0)),
            "unlocked_achievements": int(data.get("unlocked_achievements", 0)),
            "average_completion": float(data.get("average_completion", 0.0)),
            "perfect_games": data.get("perfect_games", []),
            "perfect_games_count": int(data.get("perfect_games_count", 0)),
            "last_updated": data.get("last_updated"),
            "processed_games": data.get("processed_games")
        }
        
        # Add any error from original data
        if "error" in data:
            validated["error"] = data["error"]
            
        decky.logger.debug(f"Validated progress data: {validated['unlocked_achievements']}/{validated['total_achievements']} ({validated['average_completion']}%)")
        return validated
        
    except Exception as e:
        decky.logger.error(f"Failed to validate progress data: {e}")
        return {
            "total_games": 0,
            "games_with_achievements": 0,
            "total_achievements": 0,
            "unlocked_achievements": 0,
            "average_completion": 0.0,
            "perfect_games": [],
            "perfect_games_count": 0,
            "error": f"Data validation failed: {str(e)}"
        }

class Plugin:
    """
    Main plugin class for Steam Achievement Tracker
    """

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
        self.api: Optional[SteamAPI] = None
    
    async def _main(self):
        try:
            decky.logger.info("=== Steam Achievement Tracker Starting ===")
            self.settings_dir.mkdir(parents=True, exist_ok=True)
            self.cache_dir.mkdir(parents=True, exist_ok=True)

            # Load settings
            await self.load_settings()
            
            # Get current user if not set
            if not self.current_user_id:
                self.current_user_id = await self.get_current_steam_user()

            # Initialize API
            self.api = SteamAPI(self.steam_api_key, self.current_user_id, self.cache_dir)
            
            decky.logger.info(f"Steam API Key: {bool(self.steam_api_key)}")
            decky.logger.info(f"Steam User ID: {self.current_user_id}")
        except Exception as e:
            decky.logger.error(f"Init failed: {e}")
            decky.logger.error(traceback.format_exc())        
    
    async def _unload(self):
        """Cleanup when plugin is unloaded"""
        decky.logger.info("Steam Achievement Tracker unloading")
        if self.api:
            await self.api.close()
    
    async def _migration(self):
        """Handle plugin migrations"""
        decky.logger.info("Running migrations...")
        
        # Migrate old settings if they exist
        old_settings_path = self.plugin_dir / "settings.json"
        if old_settings_path.exists() and not self.settings_file.exists():
            decky.logger.info(f"Migrating settings from {old_settings_path}")
            try:
                import shutil
                shutil.move(str(old_settings_path), str(self.settings_file))
                decky.logger.info("Settings migration completed")
            except Exception as e:
                decky.logger.error(f"Failed to migrate settings: {e}")
    
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
                    decky.logger.info("Settings loaded successfully")
                    return settings
            else:
                decky.logger.info("No settings file found, using defaults")
                return {}
        except Exception as e:
            decky.logger.error(f"Failed to load settings: {e}")
            return {}
    
    async def save_settings(self, settings: Dict) -> bool:
        """Save plugin settings"""
        try:
            # Ensure directory exists
            self.settings_dir.mkdir(parents=True, exist_ok=True)
            
            # Save settings
            with open(self.settings_file, 'w') as f:
                json.dump(settings, f, indent=2)
            
            decky.logger.info("Settings saved successfully")
            return True
        except Exception as e:
            decky.logger.error(f"Failed to save settings: {e}")
            return False
    
    async def set_steam_api_key(self, api_key: str) -> bool:
        """Set Steam API key"""
        try:
            decky.logger.info("Setting Steam API key")
            
            # Load current settings
            settings = await self.load_settings()
            
            # Update API key
            settings['steam_api_key'] = api_key
            self.steam_api_key = api_key
            
            # Save settings
            success = await self.save_settings(settings)
            
            if success:
                # Update API instance
                if self.api:
                    await self.api.close()
                self.api = SteamAPI(self.steam_api_key, self.current_user_id, self.cache_dir)
                decky.logger.info("Steam API key saved and API instance updated")
            
            return success
        except Exception as e:
            decky.logger.error(f"Failed to set API key: {e}")
            return False
    
    async def set_steam_user_id(self, user_id: str) -> bool:
        """Manually set Steam user ID"""
        try:
            decky.logger.info(f"Setting Steam user ID: {user_id}")
            
            # Validate Steam ID format (17 digits starting with 7656)
            if not re.match(r'^7656\{13}', user_id):
                decky.logger.error(f"Invalid Steam ID format: {user_id}")
                return False
            
            # Load current settings
            settings = await self.load_settings()
            
            # Update user ID
            settings['steam_user_id'] = user_id
            self.current_user_id = user_id
            
            # Save settings
            success = await self.save_settings(settings)
            
            if success:
                # Update API instance
                if self.api:
                    await self.api.close()
                self.api = SteamAPI(self.steam_api_key, self.current_user_id, self.cache_dir)
                decky.logger.info("Steam user ID saved and API instance updated")
            
            return success
        except Exception as e:
            decky.logger.error(f"Failed to set Steam user ID: {e}")
            return False
    
    async def set_test_game(self, app_id: int) -> bool:
        """Manually set a game ID for testing"""
        try:
            decky.logger.info(f"Setting test game ID: {app_id}")
            
            self.test_app_id = app_id
            
            # Save to settings
            settings = await self.load_settings()
            settings['test_app_id'] = app_id
            success = await self.save_settings(settings)
            
            return success
        except Exception as e:
            decky.logger.error(f"Failed to set test game: {e}")
            return False
    
    async def clear_test_game(self) -> bool:
        """Clear the test game ID to return to normal detection"""
        try:
            decky.logger.info("Clearing test game ID")
            
            self.test_app_id = None
            
            # Save to settings
            settings = await self.load_settings()
            if 'test_app_id' in settings:
                del settings['test_app_id']
            success = await self.save_settings(settings)
            
            if success:
                decky.logger.info("Test game cleared - will now detect running games normally")
            
            return success
        except Exception as e:
            decky.logger.error(f"Failed to clear test game: {e}")
            return False
    
    # ==================== Steam User Functions ====================
    
    async def get_current_steam_user(self) -> Optional[str]:
        """Get current Steam user ID from system"""
        try:
            # Method 1: Try to get from stored settings
            if self.current_user_id:
                decky.logger.info(f"Using saved Steam user ID: {self.current_user_id}")
                return self.current_user_id
            
            # Method 2: Try environment variable
            steam_user = os.environ.get('STEAM_USER_ID')
            if steam_user:
                decky.logger.info(f"Found Steam user ID from environment: {steam_user}")
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
                                decky.logger.info(f"Found Steam user ID from config: {steam_user}")
                                await self.set_steam_user_id(steam_user)
                                return steam_user
                    except Exception as e:
                        decky.logger.warning(f"Failed to read {steam_path}: {e}")
            
            decky.logger.warning("No Steam user ID found")
            return None
            
        except Exception as e:
            decky.logger.error(f"Failed to get Steam user: {e}")
            return None
    
    # ==================== Game Detection ====================
    
    async def get_current_game(self) -> Optional[Dict]:
        """Get currently running game"""
        try:
            # Check if we have a test game ID set - log this clearly
            if self.test_app_id:
                decky.logger.warning(f"TEST MODE: Using test game ID {self.test_app_id} instead of detecting running game")
                game_info = await self.get_game_info(self.test_app_id)
                return {
                    "app_id": self.test_app_id,
                    "name": f"[TEST] {game_info.get('name', f'App {self.test_app_id}')}",
                    "is_running": True,
                    "has_achievements": game_info.get("has_achievements", False),
                    "achievement_count": game_info.get("achievement_count", 0),
                    "header_image": game_info.get("header_image", "")
                }
            
            # Get the current app ID from Steam
            app_id = await self._get_running_app_id()
            decky.logger.info(f"Detected running app ID: {app_id}")
            
            if app_id and app_id != 0:
                # Get game details
                game_info = await self.get_game_info(app_id)
                result = {
                    "app_id": app_id,
                    "name": game_info.get("name", f"App {app_id}"),
                    "is_running": True,
                    "has_achievements": game_info.get("has_achievements", False),
                    "achievement_count": game_info.get("achievement_count", 0),
                    "header_image": game_info.get("header_image", "")
                }
                decky.logger.info(f"Current game: {result['name']} (ID: {app_id})")
                return result
            
            decky.logger.info("No game currently running")
            return None
            
        except Exception as e:
            decky.logger.error(f"Failed to get current game: {e}")
            return None
    
    async def _get_running_app_id(self) -> Optional[int]:
        """Get the currently running Steam app ID"""
        try:
            decky.logger.info("Detecting running Steam app...")
            
            # Method 1: Check for SteamAppId environment variable
            app_id = os.environ.get('SteamAppId')
            if app_id and app_id != "0":
                decky.logger.info(f"Found app ID from environment variable: {app_id}")
                return int(app_id)
            
            # Method 2: Check Steam overlay file
            overlay_file = Path("/dev/shm/SteamOverlayAppId")
            if overlay_file.exists():
                try:
                    with open(overlay_file, 'r') as f:
                        app_id = f.read().strip()
                        if app_id and app_id != "0":
                            decky.logger.info(f"Found app ID from overlay file: {app_id}")
                            return int(app_id)
                except Exception as e:
                    decky.logger.warning(f"Failed to read overlay file: {e}")
            
            # Method 3: Check Steam's AppID files in /dev/shm
            for shm_file in ["/dev/shm/SteamAppId", "/dev/shm/steam_appid.txt"]:
                try:
                    shm_path = Path(shm_file)
                    if shm_path.exists():
                        with open(shm_path, 'r') as f:
                            app_id = f.read().strip()
                            if app_id and app_id != "0":
                                decky.logger.info(f"Found app ID from {shm_file}: {app_id}")
                                return int(app_id)
                except Exception as e:
                    decky.logger.debug(f"Could not read {shm_file}: {e}")
            
            # Method 4: Check for running Steam game processes
            try:
                # Check for reaper processes with AppId
                result = subprocess.run(['pgrep', '-f', 'reaper.*AppId='], 
                                      capture_output=True, text=True, timeout=5)
                if result.stdout:
                    for line in result.stdout.strip().split('\n'):
                        if line:
                            # Get the command line for this PID
                            try:
                                cmdline_result = subprocess.run(['cat', f'/proc/{line}/cmdline'], 
                                                              capture_output=True, text=True, timeout=2)
                                if cmdline_result.stdout:
                                    match = re.search(r'AppId=(\d+)', cmdline_result.stdout)
                                    if match:
                                        app_id = match.group(1)
                                        if app_id != "0":
                                            decky.logger.info(f"Found app ID from reaper process: {app_id}")
                                            return int(app_id)
                            except:
                                continue
            except Exception as e:
                decky.logger.debug(f"Process check failed: {e}")
            
            # Method 5: Check Steam registry file
            registry_paths = [
                Path(decky.DECKY_USER_HOME) / ".steam/registry.vdf",
                Path(decky.DECKY_USER_HOME) / ".local/share/Steam/registry.vdf",
                Path("/home/deck/.steam/registry.vdf"),
                Path("/home/deck/.local/share/Steam/registry.vdf")
            ]
            
            for registry_file in registry_paths:
                if registry_file.exists():
                    try:
                        with open(registry_file, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            # Look for RunningAppID
                            match = re.search(r'"RunningAppID"\s+"(\d+)"', content)
                            if match:
                                app_id = match.group(1)
                                if app_id != "0":
                                    decky.logger.info(f"Found app ID from registry: {app_id}")
                                    return int(app_id)
                    except Exception as e:
                        decky.logger.debug(f"Failed to read registry {registry_file}: {e}")
            
            # Method 6: Check for common Steam game processes
            try:
                common_games = {
                    'csgo': 730,
                    'dota2': 570,
                    'tf2': 440,
                    'hl2': 220,
                    'left4dead2': 550
                }
                
                result = subprocess.run(['ps', 'aux'], capture_output=True, text=True, timeout=5)
                running_processes = result.stdout.lower()
                
                for game_name, game_id in common_games.items():
                    if game_name in running_processes:
                        decky.logger.info(f"Found {game_name} process, assuming app ID: {game_id}")
                        return game_id
                        
            except Exception as e:
                decky.logger.debug(f"Common games check failed: {e}")
            
            decky.logger.info("No running Steam game detected")
            return None
            
        except Exception as e:
            decky.logger.error(f"Failed to get running app ID: {e}")
            return None
    
    async def get_game_info(self, app_id: int) -> Dict:
        """Get game information from Steam Store API"""
        if not self.api:
            return {"app_id": app_id, "name": f"App {app_id}", "has_achievements": False, "achievement_count": 0}
        
        try:
            return await self.api.get_app_details(app_id)
        except Exception as e:
            decky.logger.error(f"Failed to get game info for {app_id}: {e}")
            return {"app_id": app_id, "name": f"App {app_id}", "has_achievements": False, "achievement_count": 0}
    
    # ==================== Achievement Functions ====================
    
    async def get_achievements(self, app_id: int = None) -> Dict:
        """Get achievements for a specific game"""
        try:
            if not app_id:
                game = await self.get_current_game()
                if not game:
                    return {"error": "No game running"}
                app_id = game["app_id"]

            if not self.api:
                return {"error": "Steam API not initialized"}

            if not self.steam_api_key or not self.current_user_id:
                return {"error": "Steam API key or user ID not configured"}

            decky.logger.info(f"Getting achievements for app {app_id}")
            result = await self.api.get_player_achievements(app_id)
            
            # Validate the data before returning
            if result and not result.get("error"):
                result = validate_achievement_data(result)
            
            return result

        except Exception as e:
            decky.logger.error(f"Failed to get achievements: {e}")
            return {"error": f"Failed to get achievements: {str(e)}"}
    
    # ==================== Game Statistics ====================
    
    async def get_game_stats(self, app_id: int = None) -> Dict:
        """Get detailed game statistics"""
        try:
            if not app_id:
                game = await self.get_current_game()
                if not game:
                    return {"error": "No game running"}
                app_id = game["app_id"]
            
            if not self.api or not self.steam_api_key or not self.current_user_id:
                return {"error": "Steam API key or user ID not configured"}
            
            decky.logger.info(f"Getting game stats for app {app_id}")
            
            result = await self.api.get_user_stats_for_game(app_id)
            if result:
                stats = result.get("playerstats", {}).get("stats", [])
                
                # Process stats into readable format
                processed_stats = {}
                for stat in stats:
                    processed_stats[stat["name"]] = stat["value"]
                
                return {
                    "app_id": app_id,
                    "stats": processed_stats
                }
            else:
                return {"error": "Failed to retrieve stats"}
                        
        except Exception as e:
            decky.logger.error(f"Failed to get game stats: {e}")
            return {"error": "Failed to retrieve stats"}
    
    # ==================== Recent Achievements ====================
    
    async def get_recent_achievements(self, limit: int = 10) -> List[Dict]:
        """Get recently unlocked achievements across all games"""
        try:
            if not self.api or not self.steam_api_key or not self.current_user_id:
                decky.logger.warning("Missing API key or user ID for recent achievements")
                return []
            
            decky.logger.info(f"Getting recent achievements (limit: {limit})")
            return await self.api.get_recent_achievements(limit)
                        
        except Exception as e:
            decky.logger.error(f"Failed to get recent achievements: {e}")
            return []
    
    # ==================== Overall Progress ====================
    
    async def get_achievement_progress(self, force_refresh: bool = False) -> Dict:
        """Get overall achievement progress across all games with smart caching"""
        try:
            if not self.api or not self.steam_api_key or not self.current_user_id:
                return {"error": "Not configured"}
            
            # Cache file path
            cache_file = self.cache_dir / "overall_progress.json"
            
            # Check if we should use cached data
            if not force_refresh and cache_file.exists():
                try:
                    cache_age = time.time() - cache_file.stat().st_mtime
                    
                    # Use cache if less than 24 hours old
                    if cache_age < 86400:  # 24 hours
                        with open(cache_file, 'r') as f:
                            cached_data = json.load(f)
                        
                        # Quick validation: check if game count roughly matches
                        owned_games_response = await self.api.get_owned_games()
                        if owned_games_response:
                            current_game_count = len(owned_games_response.get("response", {}).get("games", []))
                            cached_game_count = cached_data.get("total_games", 0)
                            
                            # If game count is close (within 5 games), use cache
                            if abs(current_game_count - cached_game_count) <= 5:
                                decky.logger.info(f"Using cached overall progress (age: {cache_age/3600:.1f} hours)")
                                return validate_progress_data(cached_data)
                            else:
                                decky.logger.info(f"Cache invalidated: game count changed ({cached_game_count} -> {current_game_count})")
                        
                except Exception as e:
                    decky.logger.warning(f"Cache validation failed: {e}")
            
            decky.logger.info("Calculating fresh overall achievement progress")
            
            # Get owned games
            owned_games_response = await self.api.get_owned_games()
            if not owned_games_response:
                return {"error": "Failed to get owned games"}
            
            games = owned_games_response.get("response", {}).get("games", [])
            decky.logger.info(f"Found {len(games)} owned games")
            
            total_achievements = 0
            unlocked_achievements = 0
            perfect_games = []
            games_with_achievements = 0
            processed_games = 0
            
            # Process ALL games (no limit)
            games_to_check = len(games)
            decky.logger.info(f"Checking {games_to_check} games for achievements")
            
            # Progress tracking for large libraries
            progress_interval = max(1, len(games) // 20)  # Log every 5%
            
            for i, game in enumerate(games):
                # Log progress periodically
                if i % progress_interval == 0 and i > 0:
                    decky.logger.info(f"Progress: {i}/{len(games)} games processed ({(i/len(games)*100):.1f}%)")
                
                decky.logger.debug(f"Processing game {i+1}/{games_to_check}: {game.get('name', 'Unknown')}")
                
                # Skip games without community visible stats
                if not game.get("has_community_visible_stats"):
                    continue
                    
                try:
                    achievements = await self.get_achievements(game["appid"])
                    if achievements and isinstance(achievements, dict) and not achievements.get("error"):
                        if "total" in achievements and achievements["total"] > 0:
                            games_with_achievements += 1
                            total_achievements += achievements["total"]
                            unlocked_achievements += achievements["unlocked"]
                            processed_games += 1
                            
                            decky.logger.debug(f"Game {game.get('name')}: {achievements['unlocked']}/{achievements['total']} achievements")
                            
                            # Check for perfect completion
                            if achievements["unlocked"] == achievements["total"] and achievements["total"] > 0:
                                perfect_games.append({
                                    "name": game.get("name", f"App {game['appid']}"),
                                    "app_id": game["appid"],
                                    "achievements": achievements["total"]
                                })
                                decky.logger.debug(f"Perfect game found: {game.get('name')}")
                    else:
                        decky.logger.debug(f"No achievements or error for game {game.get('name')}: {achievements}")
                        
                except Exception as e:
                    decky.logger.warning(f"Failed to get achievements for game {game.get('name', game['appid'])}: {e}")
                    continue
            
            average_completion = round((unlocked_achievements / total_achievements * 100) if total_achievements > 0 else 0, 1)
            
            result = {
                "total_games": int(len(games)),
                "games_with_achievements": int(games_with_achievements),
                "total_achievements": int(total_achievements),
                "unlocked_achievements": int(unlocked_achievements),
                "average_completion": float(average_completion),
                "perfect_games": perfect_games,
                "perfect_games_count": int(len(perfect_games)),
                "last_updated": int(time.time()),
                "processed_games": int(processed_games)
            }
            
            # Cache the result
            try:
                with open(cache_file, 'w') as f:
                    json.dump(result, f, indent=2)
                decky.logger.info("Overall progress cached successfully")
            except Exception as e:
                decky.logger.warning(f"Failed to cache overall progress: {e}")
            
            # Validate the data before returning
            result = validate_progress_data(result)
            
            decky.logger.info(f"Final progress: {result['unlocked_achievements']}/{result['total_achievements']} achievements ({result['average_completion']}% avg)")
            decky.logger.info(f"Perfect games: {result['perfect_games_count']}")
            decky.logger.info(f"Games with achievements: {result['games_with_achievements']}/{result['total_games']}")
            decky.logger.info(f"Processed {result['processed_games']} games with achievements")
            
            return result
                        
        except Exception as e:
            decky.logger.error(f"Failed to get achievement progress: {e}")
            return {"error": f"Failed to calculate progress: {str(e)}"}

    async def invalidate_progress_cache(self) -> bool:
        """Invalidate the overall progress cache"""
        try:
            cache_file = self.cache_dir / "overall_progress.json"
            if cache_file.exists():
                cache_file.unlink()
                decky.logger.info("Overall progress cache invalidated")
            return True
        except Exception as e:
            decky.logger.error(f"Failed to invalidate progress cache: {e}")
            return False
    
    # ==================== Utility Functions ====================
    
    async def refresh_cache(self, app_id: int = None) -> bool:
        """Force refresh cache for a game or all games"""
        try:
            if app_id:
                # Remove specific cache files
                cache_files = [
                    self.cache_dir / f"game_{app_id}.json"
                ]
                for cache_file in cache_files:
                    if cache_file.exists():
                        cache_file.unlink()
                decky.logger.info(f"Cache refreshed for app {app_id}")
            else:
                # Clear all cache files
                if self.cache_dir.exists():
                    for cache_file in self.cache_dir.glob("*.json"):
                        cache_file.unlink()
                decky.logger.info("All cache cleared")
            
            return True
        except Exception as e:
            decky.logger.error(f"Failed to refresh cache: {e}")
            return False
    
    async def get_log_content(self, lines: int = 100) -> str:
        """Get the last N lines of the log file for debugging"""
        try:
            log_file = os.path.join(decky.DECKY_PLUGIN_LOG_DIR, "achievement_tracker.log")
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    all_lines = f.readlines()
                    return ''.join(all_lines[-lines:])
            return "No log file found"
        except Exception as e:
            return f"Error reading log: {str(e)}"
    
    async def get_debug_info(self) -> Dict:
        """Get debugging information about current state"""
        try:
            debug_info = {
                "api_key_set": bool(self.steam_api_key),
                "user_id": self.current_user_id,
                "test_app_id": self.test_app_id,
                "detected_app_id": None,
                "environment_app_id": os.environ.get('SteamAppId'),
                "overlay_file_exists": Path("/dev/shm/SteamOverlayAppId").exists(),
                "steam_processes": []
            }
            
            # Get detected app ID
            debug_info["detected_app_id"] = await self._get_running_app_id()
            
            # Get Steam processes
            try:
                result = subprocess.run(['pgrep', '-f', 'steam'], capture_output=True, text=True, timeout=5)
                if result.stdout:
                    debug_info["steam_processes"] = result.stdout.strip().split('\n')
            except:
                pass
            
            return debug_info
        except Exception as e:
            decky.logger.error(f"Failed to get debug info: {e}")
            return {"error": str(e)}