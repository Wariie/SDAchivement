"""
Settings management service
"""
import json
import asyncio
import decky
from pathlib import Path
from typing import Dict, Optional


class SettingsService:
    """Handles all settings operations"""
    
    def __init__(self, settings_dir: Path):
        self.settings_dir = settings_dir
        self.settings_file = settings_dir / "settings.json"
        self.settings = {}
        self.api_key = None
        self.user_id = None
        self.test_app_id = None

    
    async def load(self) -> Dict:
        """Load plugin settings"""
        try:
            if self.settings_file.exists():
                # Use thread executor for non-blocking file read
                loop = asyncio.get_event_loop()
                
                def read_file():
                    with open(self.settings_file, 'r') as f:
                        return f.read()
                
                content = await loop.run_in_executor(None, read_file)
                self.settings = json.loads(content)
                # Extract values for easy access
                self.api_key = self.settings.get('steam_api_key')
                self.user_id = self.settings.get('steam_user_id') 
                self.test_app_id = self.settings.get('test_app_id')
                decky.logger.info(f"Settings loaded successfully - API key: {bool(self.api_key)}, User ID: {self.user_id}")
                return self.settings
            else:
                decky.logger.info("No settings file found, using defaults")
                self.settings = {}
                return {}
        except Exception as e:
            decky.logger.error(f"Failed to load settings: {e}")
            self.settings = {}
            return {}
    
    async def save(self, settings: Dict) -> bool:
        """Save plugin settings"""
        try:
            self.settings_dir.mkdir(parents=True, exist_ok=True)
            
            # Use thread executor for non-blocking file write
            loop = asyncio.get_event_loop()
            content = json.dumps(settings, indent=2)
            
            def write_file():
                with open(self.settings_file, 'w') as f:
                    f.write(content)
            
            await loop.run_in_executor(None, write_file)
            
            # Update internal state
            self.settings = settings
            self.api_key = settings.get('steam_api_key')
            self.user_id = settings.get('steam_user_id')
            self.test_app_id = settings.get('test_app_id')
            
            decky.logger.info(f"Settings saved successfully - API key: {bool(self.api_key)}, User ID: {self.user_id}")
            return True
        except Exception as e:
            decky.logger.error(f"Failed to save settings: {e}")
            return False

    async def set_api_key(self, api_key: str) -> bool:
        """Set Steam API key"""
        try:
            decky.logger.info("Setting Steam API key")
            
            # Ensure settings is initialized
            if not hasattr(self, 'settings') or self.settings is None:
                self.settings = {}
            
            settings = self.settings.copy()
            settings['steam_api_key'] = api_key
            return await self.save(settings)
        except Exception as e:
            decky.logger.error(f"Failed to set API key: {e}")
            return False

    async def set_user_id(self, user_id: str) -> bool:
        """Set Steam user ID"""
        try:
            decky.logger.info(f"Setting Steam user ID: {user_id}")
            
            # Ensure settings is initialized
            if not hasattr(self, 'settings') or self.settings is None:
                self.settings = {}
            
            settings = self.settings.copy()
            settings['steam_user_id'] = user_id
            return await self.save(settings)
        except Exception as e:
            decky.logger.error(f"Failed to set user ID: {e}")
            return False
    
    
    async def set_test_game(self, app_id: int) -> bool:
        """Set test game ID"""
        try:
            decky.logger.info(f"Setting test game ID: {app_id}")
            settings = self.settings.copy()
            settings['test_app_id'] = app_id
            return await self.save(settings)
        except Exception as e:
            decky.logger.error(f"Failed to set test game: {e}")
            return False
    
    async def clear_test_game(self) -> bool:
        """Clear test game ID"""
        try:
            decky.logger.info("Clearing test game ID")
            settings = self.settings.copy()
            if 'test_app_id' in settings:
                del settings['test_app_id']
            return await self.save(settings)
        except Exception as e:
            decky.logger.error(f"Failed to clear test game: {e}")
            return False

    async def set_tracked_game(self, app_id: int, name: str) -> bool:
        """Set tracked game"""
        try:
            decky.logger.info(f"Setting tracked game: {name} (ID: {app_id})")
            settings = self.settings.copy()
            settings['tracked_game'] = {
                'app_id': app_id,
                'name': name,
                'last_checked': None
            }
            return await self.save(settings)
        except Exception as e:
            decky.logger.error(f"Failed to set tracked game: {e}")
            return False
    
    async def clear_tracked_game(self) -> bool:
        """Clear tracked game"""
        try:
            decky.logger.info("Clearing tracked game")
            settings = self.settings.copy()
            if 'tracked_game' in settings:
                del settings['tracked_game']
            return await self.save(settings)
        except Exception as e:
            decky.logger.error(f"Failed to clear tracked game: {e}")
            return False
    
    def get_tracked_game(self) -> Optional[Dict]:
        """Get current tracked game"""
        return self.settings.get('tracked_game')
    
