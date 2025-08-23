"""
Main plugin class that orchestrates all services
"""
import decky
import traceback
from pathlib import Path
from typing import Dict, List, Optional

from services.settings import SettingsService
from services.game_detector import GameDetectorService
from services.achievement import AchievementService
from services.cache import CacheService
from services.steam_scanner import SteamScannerService
from utils.debug import DebugUtils
from steam_api import SteamAPI


class Plugin:
    """
    Main plugin class for Steam Achievement Tracker
    Orchestrates all services and handles plugin lifecycle
    """

    def __init__(self):
        # Initialize paths
        self.plugin_dir = Path(decky.DECKY_PLUGIN_DIR)
        self.settings_dir = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)
        self.cache_dir = Path(decky.DECKY_PLUGIN_RUNTIME_DIR) / "cache"
        
        # Initialize services
        self.settings_service = SettingsService(self.settings_dir)
        self.game_detector = GameDetectorService()
        self.cache_service = CacheService(self.cache_dir)
        self.steam_scanner = SteamScannerService()
        self.debug_utils = DebugUtils()
        
        # These will be initialized after settings are loaded
        self.achievement_service = None
        self.api: Optional[SteamAPI] = None
        
        # State
        self.steam_api_key = None
        self.current_user_id = None
        self.test_app_id = None
    
    async def _main(self):
        """Initialize the plugin"""
        try:
            decky.logger.info("=== Steam Achievement Tracker Starting ===")
            
            # Ensure directories exist
            self.settings_dir.mkdir(parents=True, exist_ok=True)
            self.cache_dir.mkdir(parents=True, exist_ok=True)

            # Load settings
            await self.settings_service.load()
            self.steam_api_key = self.settings_service.api_key
            self.current_user_id = self.settings_service.user_id
            self.test_app_id = self.settings_service.test_app_id

            decky.logger.info(f"Loaded settings - API Key set: {bool(self.steam_api_key)}, User ID: {self.current_user_id}, Test App: {self.test_app_id}")
            
            # Get current user if not set
            if not self.current_user_id:
                detected_user = await self.game_detector.get_current_steam_user()
                if detected_user:
                    decky.logger.info(f"Auto-detected Steam user: {detected_user}")
                    await self.set_steam_user_id(detected_user)
                else:
                    decky.logger.warning("No Steam user ID detected - plugin will need manual configuration")

            # Initialize API and achievement service
            if self.steam_api_key and self.current_user_id:
                self.api = SteamAPI(self.steam_api_key, self.current_user_id, self.cache_dir)
                self.achievement_service = AchievementService(
                    self.api,
                    self.cache_service,
                    self.steam_api_key,
                    self.current_user_id
                )
                decky.logger.info("API and achievement service initialized successfully")

            else:
                decky.logger.warning(f"Cannot initialize API - missing {'API key' if not self.steam_api_key else 'user ID'}")

            decky.logger.info(f"Plugin initialization complete - API ready: {bool(self.api)}")
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
        new_settings_path = self.settings_dir / "settings.json"
        
        if old_settings_path.exists() and not new_settings_path.exists():
            decky.logger.info(f"Migrating settings from {old_settings_path}")
            try:
                import shutil
                shutil.move(str(old_settings_path), str(new_settings_path))
                decky.logger.info("Settings migration completed")
            except Exception as e:
                decky.logger.error(f"Failed to migrate settings: {e}")
    
    # ==================== Settings Management ====================

    async def load_settings(self) -> Dict:
        """Load and return settings for UI (callable from frontend)"""
        try:
            # Force reload from disk to ensure fresh data
            await self.settings_service.load()
            
            # Update plugin state
            self.steam_api_key = self.settings_service.api_key
            self.current_user_id = self.settings_service.user_id
            self.test_app_id = self.settings_service.test_app_id

            refresh_interval = self.settings_service.settings.get('refresh_interval', 30) if self.settings_service.settings else 30
            
            # Return settings for UI
            return {
                "steam_api_key": self.steam_api_key or "",
                "steam_user_id": self.current_user_id or "",
                "test_app_id": self.test_app_id,
                "auto_refresh": self.settings_service.settings.get('auto_refresh', True) if self.settings_service.settings else True,# You can add these to settings service if needed
                "refresh_interval": refresh_interval,
                "tracked_game": self.settings_service.get_tracked_game()
            }
        except Exception as e:
            decky.logger.error(f"Failed to load settings: {e}")
            return {}

    async def get_settings(self) -> Dict:
        """Get current settings without reloading from disk"""
        try:
            refresh_interval = self.settings_service.settings.get('refresh_interval', 30) if self.settings_service.settings else 30
            auto_refresh = self.settings_service.settings.get('auto_refresh', True) if self.settings_service.settings else True

            return {
                "steam_api_key": self.settings_service.api_key or "",
                "steam_user_id": self.settings_service.user_id or "",
                "test_app_id": self.settings_service.test_app_id,
                "api_key_set": bool(self.settings_service.api_key),
                "user_id_set": bool(self.settings_service.user_id),
                "auto_refresh": auto_refresh,
                "refresh_interval": refresh_interval,
                "tracked_game": self.settings_service.get_tracked_game()
            }
        except Exception as e:
            decky.logger.error(f"Failed to get settings: {e}")
            return {}

    async def reload_settings(self) -> Dict:
        """Force reload settings from disk and return them"""
        try:
            decky.logger.info("Force reloading settings from disk")
            
            # Reload from disk
            await self.settings_service.load()
            
            # Update Plugin's state
            self.steam_api_key = self.settings_service.api_key
            self.current_user_id = self.settings_service.user_id
            self.test_app_id = self.settings_service.test_app_id
            
            # Reinitialize API if needed
            if self.steam_api_key and self.current_user_id:
                await self._reinitialize_api()
            
            decky.logger.info(f"Settings reloaded - API Key: {bool(self.steam_api_key)}, User ID: {self.current_user_id}")
            
            # Return the current settings for UI
            refresh_interval = self.settings_service.settings.get('refresh_interval', 30) if self.settings_service.settings else 30
            auto_refresh = self.settings_service.settings.get('auto_refresh', True) if self.settings_service.settings else True
            
            return {
                "steam_api_key": self.settings_service.api_key or "",
                "steam_user_id": self.settings_service.user_id or "",
                "test_app_id": self.settings_service.test_app_id,
                "api_key_set": bool(self.settings_service.api_key),
                "user_id_set": bool(self.settings_service.user_id),
                "auto_refresh": auto_refresh,
                "refresh_interval": refresh_interval,
                "tracked_game": self.settings_service.get_tracked_game()
            }
                
        except Exception as e:
            decky.logger.error(f"Failed to reload settings: {e}")
            return {"error": str(e)}
        
    async def set_auto_refresh(self, enabled: bool) -> bool:
        """Set and save the auto-refresh enabled state"""
        try:
            decky.logger.info(f"Setting auto-refresh to {enabled}")
            
            # Get the current settings from the service's internal state
            current_settings = self.settings_service.settings.copy() if self.settings_service.settings else {}
            
            # Update auto_refresh
            current_settings['auto_refresh'] = enabled
            
            # Save settings using the service
            success = await self.settings_service.save(current_settings)
            
            if success:
                decky.logger.info(f"Auto-refresh setting saved: {enabled}")
            
            return success
        except Exception as e:
            decky.logger.error(f"Failed to set auto-refresh: {e}")
            return False
    
    async def set_steam_api_key(self, api_key: str) -> bool:
        """Set Steam API key"""
        try:
            success = await self.settings_service.set_api_key(api_key)
            if success:
                self.steam_api_key = api_key
                await self._reinitialize_api()
                decky.logger.info("API key set and services reinitialized")
            return success
        except Exception as e:
            decky.logger.error(f"Failed to set API key: {e}")
            return False
    
    async def set_steam_user_id(self, user_id: str) -> bool:
        """Set Steam user ID"""
        try:
            success = await self.settings_service.set_user_id(user_id)
            if success:
                self.current_user_id = user_id
                await self._reinitialize_api()
                decky.logger.info("User ID set and services reinitialized")
            return success
        except Exception as e:
            decky.logger.error(f"Failed to set user ID: {e}")
            return False
        
    async def set_tracked_game(self, app_id: int, name: str) -> bool:
        """Set tracked game"""
        return await self.settings_service.set_tracked_game(app_id, name)

    async def clear_tracked_game(self) -> bool:
        """Clear tracked game"""
        return await self.settings_service.clear_tracked_game()

    async def set_refresh_interval(self, interval: int) -> bool:
        """Set and save the auto-refresh interval"""
        try:
            decky.logger.info(f"Setting refresh interval to {interval} seconds")
            
            # Get the current settings from the service's internal state
            current_settings = self.settings_service.settings.copy() if self.settings_service.settings else {}
            
            # Update refresh interval
            current_settings['refresh_interval'] = interval
            
            # Save settings using the service
            success = await self.settings_service.save(current_settings)
            
            if success:
                decky.logger.info(f"Refresh interval saved: {interval} seconds")
            else:
                decky.logger.error("Failed to save refresh interval")
            
            return success
        except Exception as e:
            decky.logger.error(f"Failed to set refresh interval: {e}")
            return False
    
    async def set_test_game(self, app_id: int) -> bool:
        """Set test game ID"""
        success = await self.settings_service.set_test_game(app_id)
        if success:
            self.test_app_id = app_id
        return success
    
    async def clear_test_game(self) -> bool:
        """Clear test game ID"""
        success = await self.settings_service.clear_test_game()
        if success:
            self.test_app_id = None
        return success
    
    # ==================== Game Detection ====================
    
    async def get_current_game(self) -> Optional[Dict]:
        """Get currently running game"""
        return await self.game_detector.get_current_game(self.test_app_id, self.api)
    
    async def get_current_steam_user(self) -> Optional[str]:
        """Get current Steam user ID"""
        user_id = await self.game_detector.get_current_steam_user()
        if user_id and not self.current_user_id:
            await self.set_steam_user_id(user_id)
        return user_id
    
    async def get_game_info(self, app_id: int) -> Dict:
        """Get game information"""
        return await self.game_detector.get_game_info(app_id, self.api)
    
    async def get_installed_games(self) -> List[Dict]:
        """Get locally installed Steam games by scanning installation files"""
        return await self.steam_scanner.get_installed_games()
    
    # ==================== Achievement Functions ====================
    
    async def get_achievements(self, app_id: int = None) -> Dict:
        """Get achievements for a game"""
        if not self.achievement_service:
            return {"error": "Achievement service not initialized"}
        
        if not app_id:
            game = await self.get_current_game()
            if not game:
                return {"error": "No game running"}
            app_id = game["app_id"]
        
        return await self.achievement_service.get_achievements(app_id)
    
    async def get_game_stats(self, app_id: int = None) -> Dict:
        """Get game statistics"""
        if not self.achievement_service:
            return {"error": "Achievement service not initialized"}
        
        if not app_id:
            game = await self.get_current_game()
            if not game:
                return {"error": "No game running"}
            app_id = game["app_id"]
        
        return await self.achievement_service.get_game_stats(app_id)
    
    async def get_recent_achievements(self, limit: int = 10) -> List[Dict]:
        """Get recent achievements"""
        if not self.achievement_service:
            return []
        return await self.achievement_service.get_recent_achievements(limit)
    
    async def get_achievement_progress(self, force_refresh: bool = False) -> Dict:
        """Get overall achievement progress"""
        if not self.achievement_service:
            return {"error": "Achievement service not initialized"}
        return await self.achievement_service.get_achievement_progress(force_refresh)
    
    # ==================== Cache Management ====================
    
    async def refresh_cache(self, app_id: int = None) -> bool:
        """Refresh cache"""
        return await self.cache_service.refresh_cache(app_id)
    
    async def invalidate_progress_cache(self) -> bool:
        """Invalidate progress cache"""
        return await self.cache_service.invalidate_progress_cache()
    
    # ==================== Debug Functions ====================
    
    # async def get_log_content(self, lines: int = 100) -> str:
    #     """Get log content"""
    #     return await self.debug_utils.get_log_content(lines)
    
    # async def get_debug_info(self) -> Dict:
    #     """Get debug information"""
    #     debug_info = await self.debug_utils.get_debug_info()
    #     debug_info.update({
    #         "api_key_set": bool(self.steam_api_key),
    #         "user_id": self.current_user_id,
    #         "test_app_id": self.test_app_id
    #     })
    #     return debug_info
    
    # ==================== Private Methods ====================
    
    async def _reinitialize_api(self):
        """Reinitialize API after settings change"""
        try:
            if self.api:
                await self.api.close()
            
            if self.steam_api_key and self.current_user_id:
                self.api = SteamAPI(self.steam_api_key, self.current_user_id, self.cache_dir)
                self.achievement_service = AchievementService(
                    self.api,
                    self.cache_service,
                    self.steam_api_key,
                    self.current_user_id
                )
                decky.logger.info("API and services reinitialized")
        except Exception as e:
            decky.logger.error(f"Failed to reinitialize API: {e}")