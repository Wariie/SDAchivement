"""
Steam installation scanner service
Scans local Steam installation to find installed games
"""
import re
import decky
from pathlib import Path
from typing import List, Dict, Optional


class SteamScannerService:
    """Scans local Steam installation for installed games"""
    
    def __init__(self):
        self.steam_paths = [
            Path.home() / ".local/share/Steam",  # Default Steam path on Steam Deck
            Path("/home/deck/.steam/steam"),      # Alternative path
            Path("/home/deck/.local/share/Steam"), # Another common path
        ]
        
    def get_steam_path(self) -> Optional[Path]:
        """Find the Steam installation path"""
        for path in self.steam_paths:
            if path.exists() and path.is_dir():
                decky.logger.info(f"Found Steam installation at: {path}")
                return path
        
        decky.logger.warning("Could not find Steam installation path")
        return None
    
    def get_library_folders(self, steam_path: Path) -> List[Path]:
        """Get all Steam library folders from libraryfolders.vdf"""
        library_folders = []
        
        # Try to read libraryfolders.vdf
        vdf_path = steam_path / "steamapps" / "libraryfolders.vdf"
        if not vdf_path.exists():
            decky.logger.warning(f"libraryfolders.vdf not found at {vdf_path}")
            # Fallback to default steamapps folder
            default_steamapps = steam_path / "steamapps"
            if default_steamapps.exists():
                library_folders.append(default_steamapps)
            return library_folders
        
        try:
            with open(vdf_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Parse VDF format to find library paths
            # Look for "path" entries in the VDF file
            path_pattern = r'"path"\s*"([^"]+)"'
            paths = re.findall(path_pattern, content)
            
            for path_str in paths:
                # Convert Windows paths to proper format
                path_str = path_str.replace('\\\\', '/')
                library_path = Path(path_str) / "steamapps"
                if library_path.exists():
                    library_folders.append(library_path)
                    decky.logger.info(f"Found library folder: {library_path}")
                    
        except Exception as e:
            decky.logger.error(f"Error reading libraryfolders.vdf: {e}")
            # Fallback to default
            default_steamapps = steam_path / "steamapps"
            if default_steamapps.exists():
                library_folders.append(default_steamapps)
                
        return library_folders
    
    def scan_acf_files(self, steamapps_path: Path) -> List[Dict]:
        """Scan .acf files in a steamapps directory"""
        installed_games = []
        
        try:
            acf_files = list(steamapps_path.glob("appmanifest_*.acf"))
            decky.logger.info(f"Found {len(acf_files)} ACF files in {steamapps_path}")
            
            for acf_file in acf_files:
                try:
                    with open(acf_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # Parse ACF format
                    app_info = self.parse_acf_content(content)
                    if app_info:
                        installed_games.append(app_info)
                        
                except Exception as e:
                    decky.logger.error(f"Error reading ACF file {acf_file}: {e}")
                    continue
                    
        except Exception as e:
            decky.logger.error(f"Error scanning ACF files in {steamapps_path}: {e}")
            
        return installed_games
    
    def parse_acf_content(self, content: str) -> Optional[Dict]:
        """Parse ACF file content to extract game info"""
        try:
            # Extract appid
            appid_match = re.search(r'"appid"\s*"(\d+)"', content)
            if not appid_match:
                return None
            app_id = int(appid_match.group(1))
            
            # Extract name
            name_match = re.search(r'"name"\s*"([^"]+)"', content)
            if not name_match:
                return None
            name = name_match.group(1)
            
            # Extract install directory
            installdir_match = re.search(r'"installdir"\s*"([^"]+)"', content)
            installdir = installdir_match.group(1) if installdir_match else ""
            
            # Check if it's installed (state flags)
            state_match = re.search(r'"StateFlags"\s*"(\d+)"', content)
            state = int(state_match.group(1)) if state_match else 0
            
            # State flag 4 means "fully installed"
            is_installed = (state & 4) != 0
            
            if is_installed:
                return {
                    "app_id": app_id,
                    "name": name,
                    "installdir": installdir,
                    "has_achievements": True,  # We'll assume all games might have achievements
                    "achievements": 0,  # Will be filled later if needed
                    "is_running": False,
                    "playtime_forever": 0
                }
                
        except Exception as e:
            decky.logger.error(f"Error parsing ACF content: {e}")
            
        return None
    
    async def get_installed_games(self) -> List[Dict]:
        """Get all installed Steam games by scanning ACF files"""
        try:
            decky.logger.info("Starting Steam installed games scan...")
            
            steam_path = self.get_steam_path()
            if not steam_path:
                return []
            
            library_folders = self.get_library_folders(steam_path)
            if not library_folders:
                decky.logger.warning("No Steam library folders found")
                return []
            
            all_games = []
            for library_folder in library_folders:
                games = self.scan_acf_files(library_folder)
                all_games.extend(games)
                decky.logger.info(f"Found {len(games)} games in {library_folder}")
            
            # Remove duplicates based on app_id
            unique_games = {}
            for game in all_games:
                unique_games[game["app_id"]] = game
            
            final_games = list(unique_games.values())
            # Sort by name for better UX
            final_games.sort(key=lambda x: x["name"].lower())
            
            decky.logger.info(f"Total installed games found: {len(final_games)}")
            return final_games
            
        except Exception as e:
            decky.logger.error(f"Error scanning installed games: {e}")
            return []
        
    def get_game_artwork(self, app_id: int) -> Dict[str, Optional[Path]]:
        """Return paths to artwork files for a given game (grid, hero, logo, icon)."""
        steam_path = self.get_steam_path()
        if not steam_path:
            return {}

        user_paths = list((steam_path / "userdata").glob("*/config/grid"))
        artwork = {"grid": None, "hero": None, "logo": None, "icon": None}

        # Check user-specific artwork overrides
        for grid_path in user_paths:
            for suffix in ["", "_hero", "_logo", "_icon"]:
                file = grid_path / f"{app_id}{suffix}.png"
                if file.exists():
                    key = suffix[1:] if suffix else "grid"
                    artwork[key] = file

        # Fallback: librarycache (official Steam artwork)
        cache_path = steam_path / "appcache/librarycache"
        for key in artwork:
            if not artwork[key]:
                fallback = cache_path / f"{app_id}_{key}.jpg"
                if fallback.exists():
                    artwork[key] = fallback
        
        return artwork