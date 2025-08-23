"""
Game detection service
"""
import os
import re
import subprocess
import decky
from pathlib import Path
from typing import Dict, Optional


class GameDetectorService:
    """Handles game detection and Steam user identification"""
    
    async def get_current_steam_user(self) -> Optional[str]:
        """Get current Steam user ID from system"""
        try:
            # Try environment variable
            steam_user = os.environ.get('STEAM_USER_ID')
            if steam_user:
                decky.logger.info(f"Found Steam user ID from environment: {steam_user}")
                return steam_user
            
            # Try to read from Steam's loginusers.vdf
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
                            matches = re.findall(r'"(7656\d{13})"', content)
                            if matches:
                                steam_user = matches[0]
                                decky.logger.info(f"Found Steam user ID from config: {steam_user}")
                                return steam_user
                    except Exception as e:
                        decky.logger.warning(f"Failed to read {steam_path}: {e}")
            
            decky.logger.warning("No Steam user ID found")
            return None
            
        except Exception as e:
            decky.logger.error(f"Failed to get Steam user: {e}")
            return None
    
    async def get_current_game(self, test_app_id: Optional[int], api) -> Optional[Dict]:
        """Get currently running game"""
        try:
            # Check for test mode
            if test_app_id:
                decky.logger.warning(f"TEST MODE: Using test game ID {test_app_id}")
                game_info = await self.get_game_info(test_app_id, api)
                return {
                    "app_id": test_app_id,
                    "name": f"[TEST] {game_info.get('name', f'App {test_app_id}')}",
                    "is_running": True,
                    "has_achievements": game_info.get("has_achievements", False),
                    "achievement_count": game_info.get("achievement_count", 0),
                    "header_image": game_info.get("header_image", "")
                }
            
            # Get the current app ID from Steam
            app_id = await self._get_running_app_id()
            decky.logger.info(f"Detected running app ID: {app_id}")
            
            if app_id and app_id != 0:
                game_info = await self.get_game_info(app_id, api)
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
    
    async def get_game_info(self, app_id: int, api) -> Dict:
        """Get game information from Steam Store API"""
        if not api:
            return {
                "app_id": app_id,
                "name": f"App {app_id}",
                "has_achievements": False,
                "achievement_count": 0
            }
        
        try:
            return await api.get_app_details(app_id)
        except Exception as e:
            decky.logger.error(f"Failed to get game info for {app_id}: {e}")
            return {
                "app_id": app_id,
                "name": f"App {app_id}",
                "has_achievements": False,
                "achievement_count": 0
            }
    
    async def _get_running_app_id(self) -> Optional[int]:
        """Get the currently running Steam app ID"""
        try:
            decky.logger.info("Detecting running Steam app...")
            
            # Method 1: Check environment variable
            app_id = os.environ.get('SteamAppId')
            if app_id and app_id != "0":
                decky.logger.info(f"Found app ID from environment: {app_id}")
                return int(app_id)
            
            # Method 2: Check overlay file
            overlay_file = Path("/dev/shm/SteamOverlayAppId")
            if overlay_file.exists():
                try:
                    with open(overlay_file, 'r') as f:
                        app_id = f.read().strip()
                        if app_id and app_id != "0":
                            decky.logger.info(f"Found app ID from overlay: {app_id}")
                            return int(app_id)
                except Exception as e:
                    decky.logger.warning(f"Failed to read overlay file: {e}")
            
            # Method 3: Check other /dev/shm files
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
            
            # Method 4: Check process list
            try:
                result = subprocess.run(['pgrep', '-f', 'reaper.*AppId='], 
                                      capture_output=True, text=True, timeout=5)
                if result.stdout:
                    for pid in result.stdout.strip().split('\n'):
                        if pid:
                            try:
                                cmdline_result = subprocess.run(
                                    ['cat', f'/proc/{pid}/cmdline'],
                                    capture_output=True, text=True, timeout=2
                                )
                                if cmdline_result.stdout:
                                    match = re.search(r'AppId=(\d+)', cmdline_result.stdout)
                                    if match:
                                        app_id = match.group(1)
                                        if app_id != "0":
                                            decky.logger.info(f"Found app ID from process: {app_id}")
                                            return int(app_id)
                            except:
                                continue
            except Exception as e:
                decky.logger.debug(f"Process check failed: {e}")
            
            # Method 5: Check registry file
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
                            match = re.search(r'"RunningAppID"\s+"(\d+)"', content)
                            if match:
                                app_id = match.group(1)
                                if app_id != "0":
                                    decky.logger.info(f"Found app ID from registry: {app_id}")
                                    return int(app_id)
                    except Exception as e:
                        decky.logger.debug(f"Failed to read registry: {e}")
            
            decky.logger.info("No running Steam game detected")
            return None
            
        except Exception as e:
            decky.logger.error(f"Failed to get running app ID: {e}")
            return None