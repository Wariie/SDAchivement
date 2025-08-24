"""
Cache management service
"""
import json
import time
import asyncio
import decky
from pathlib import Path
from typing import Dict, Optional


class CacheService:
    """Handles all caching operations"""
    
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    async def get_progress_cache(self) -> Optional[Dict]:
        """Get cached overall progress if valid"""
        try:
            cache_file = self.cache_dir / "overall_progress.json"
            
            if cache_file.exists():
                cache_age = time.time() - cache_file.stat().st_mtime
                
                # Use cache if less than 24 hours old
                if cache_age < 86400:  # 24 hours
                    # Use thread executor for non-blocking file read
                    loop = asyncio.get_event_loop()
                    
                    def read_file():
                        with open(cache_file, 'r') as f:
                            return f.read()
                    
                    content = await loop.run_in_executor(None, read_file)
                    cached_data = json.loads(content)
                    
                    decky.logger.info(f"Found cached progress (age: {cache_age/3600:.1f} hours)")
                    return cached_data
            
            return None
            
        except Exception as e:
            decky.logger.warning(f"Failed to read cache: {e}")
            return None
    
    async def save_progress_cache(self, data: Dict) -> bool:
        """Save overall progress to cache"""
        try:
            cache_file = self.cache_dir / "overall_progress.json"
            
            # Use thread executor for non-blocking file write
            loop = asyncio.get_event_loop()
            content = json.dumps(data, indent=2)
            
            def write_file():
                with open(cache_file, 'w') as f:
                    f.write(content)
            
            await loop.run_in_executor(None, write_file)
            
            decky.logger.info("Overall progress cached successfully")
            return True
            
        except Exception as e:
            decky.logger.warning(f"Failed to cache progress: {e}")
            return False
    
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
    
    async def refresh_cache(self, app_id: int = None) -> bool:
        """Force refresh cache for a game or all games"""
        try:
            if app_id:
                # Remove specific cache files
                cache_files = [
                    self.cache_dir / f"game_{app_id}.json",
                    self.cache_dir / f"achievements_{app_id}.json"
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
    
    def get_cache_path(self, filename: str) -> Path:
        """Get full path for a cache file"""
        return self.cache_dir / filename
    
    async def get_cached_data(self, filename: str, max_age: int = 3600) -> Optional[Dict]:
        """Get cached data if it exists and is fresh"""
        try:
            cache_file = self.cache_dir / filename
            
            if cache_file.exists():
                cache_age = time.time() - cache_file.stat().st_mtime
                
                if cache_age < max_age:
                    # Use thread executor for non-blocking file read
                    loop = asyncio.get_event_loop()
                    
                    def read_file():
                        with open(cache_file, 'r') as f:
                            return f.read()
                    
                    content = await loop.run_in_executor(None, read_file)
                    return json.loads(content)
            
            return None
            
        except Exception as e:
            decky.logger.warning(f"Failed to read cache file {filename}: {e}")
            return None
    
    async def save_cached_data(self, filename: str, data: Dict) -> bool:
        """Save data to cache"""
        try:
            cache_file = self.cache_dir / filename
            
            # Use thread executor for non-blocking file write
            loop = asyncio.get_event_loop()
            content = json.dumps(data, indent=2)
            
            def write_file():
                with open(cache_file, 'w') as f:
                    f.write(content)
            
            await loop.run_in_executor(None, write_file)
            
            return True
            
        except Exception as e:
            decky.logger.warning(f"Failed to save cache file {filename}: {e}")
            return False