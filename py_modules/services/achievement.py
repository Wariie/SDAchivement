"""
Achievement service for fetching and processing achievement data
"""
import time
import json
import asyncio
import decky
from typing import Dict, List, Optional
from models.validators import validate_achievement_data, validate_progress_data


class AchievementService:
    """Handles all achievement-related operations"""
    
    def __init__(self, api, cache_service, api_key: str, user_id: str):
        self.api = api
        self.cache_service = cache_service
        self.api_key = api_key
        self.user_id = user_id
    
    async def get_achievements(self, app_id: int) -> Dict:
        """Get achievements for a specific game"""
        try:
            if not self.api:
                return {"error": "Steam API not initialized"}

            if not self.api_key or not self.user_id:
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
    
    async def get_game_stats(self, app_id: int) -> Dict:
        """Get detailed game statistics"""
        try:
            if not self.api or not self.api_key or not self.user_id:
                return {"error": "Steam API not configured"}
            
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
    
    async def get_recent_achievements(self, limit: int = 10) -> List[Dict]:
        """Get recently unlocked achievements across all games"""
        try:
            if not self.api or not self.api_key or not self.user_id:
                decky.logger.warning("Missing API key or user ID for recent achievements")
                return []
            
            decky.logger.info(f"Getting recent achievements (limit: {limit})")
            return await self.api.get_recent_achievements(limit)
                        
        except Exception as e:
            decky.logger.error(f"Failed to get recent achievements: {e}")
            return []
    
    async def get_user_games(self) -> List[Dict]:
        """Get all user's owned games with community stats (likely has achievements)"""
        try:
            if not self.api:
                decky.logger.error("Steam API not initialized for get_user_games")
                return []

            if not self.api_key or not self.user_id:
                decky.logger.error("Steam API key or user ID not configured for get_user_games")
                return []

            decky.logger.info("Getting user's owned games")
            
            # Get owned games
            owned_games = await self.api.get_owned_games()
            if not owned_games:
                decky.logger.error("Failed to get owned games")
                return []
            
            games = owned_games.get("response", {}).get("games", [])
            decky.logger.info(f"Found {len(games)} total owned games")
            
            # Filter games that likely have achievements (has_community_visible_stats)
            # This is much faster than checking schema for each game
            games_with_achievements = []
            for game in games:
                if game.get("has_community_visible_stats", False):
                    games_with_achievements.append({
                        "app_id": game["appid"],
                        "name": game["name"],
                        "has_achievements": True,
                        "achievements": 0,  # We don't know the exact count, but that's okay
                        "playtime_forever": game.get("playtime_forever", 0),
                        "is_running": False
                    })
            
            decky.logger.info(f"Found {len(games_with_achievements)} games with community stats")
            
            # Sort by playtime for better UX (most played first)
            games_with_achievements.sort(key=lambda x: x.get("playtime_forever", 0), reverse=True)
            return games_with_achievements
            
        except Exception as e:
            decky.logger.error(f"Failed to get user games: {e}")
            return []

    async def get_achievement_progress(self, force_refresh: bool = False) -> Dict:
        """Get overall achievement progress across all games"""
        try:
            if not self.api or not self.api_key or not self.user_id:
                return {"error": "Not configured"}
            
            # Try to get from cache first
            if not force_refresh:
                cached_data = await self.cache_service.get_progress_cache()
                if cached_data:
                    # Validate game count hasn't changed significantly
                    owned_games = await self.api.get_owned_games()
                    if owned_games:
                        current_count = len(owned_games.get("response", {}).get("games", []))
                        cached_count = cached_data.get("total_games", 0)
                        
                        if abs(current_count - cached_count) <= 5:
                            decky.logger.info("Using cached overall progress")
                            return validate_progress_data(cached_data)
            
            decky.logger.info("Calculating fresh overall achievement progress")
            
            # Get owned games
            owned_games = await self.api.get_owned_games()
            if not owned_games:
                return {"error": "Failed to get owned games"}
            
            games = owned_games.get("response", {}).get("games", [])
            decky.logger.info(f"Found {len(games)} owned games")
            
            total_achievements = 0
            unlocked_achievements = 0
            perfect_games = []
            games_with_achievements = 0
            processed_games = 0
            
            # Process games concurrently in controlled batches
            batch_size = 8  # Process 8 games at a time
            semaphore = asyncio.Semaphore(4)  # Limit concurrent API requests to 4
            
            async def process_game(game):
                """Process a single game with semaphore control"""
                async with semaphore:
                    # Skip games without community visible stats
                    if not game.get("has_community_visible_stats"):
                        return None
                        
                    try:
                        achievements = await self.get_achievements(game["appid"])
                        if achievements and isinstance(achievements, dict) and not achievements.get("error"):
                            if "total" in achievements and achievements["total"] > 0:
                                result = {
                                    "achievements": achievements,
                                    "game": game,
                                    "is_perfect": achievements["unlocked"] == achievements["total"]
                                }
                                
                                # Get header image for perfect games only
                                if result["is_perfect"]:
                                    try:
                                        app_details = await self.api.get_app_details(game["appid"])
                                        result["header_image"] = app_details.get("header_image", "") if app_details else ""
                                    except Exception:
                                        result["header_image"] = ""
                                
                                return result
                                
                    except Exception as e:
                        decky.logger.warning(f"Failed to get achievements for {game.get('name', game['appid'])}: {e}")
                    return None
            
            # Process games in batches to avoid overwhelming the API
            total_batches = (len(games) + batch_size - 1) // batch_size
            for i in range(0, len(games), batch_size):
                batch = games[i:i + batch_size]
                batch_num = i // batch_size + 1
                decky.logger.info(f"Processing batch {batch_num}/{total_batches}: {len(batch)} games")
                
                # Process batch concurrently
                tasks = [process_game(game) for game in batch]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results from this batch
                for result in results:
                    if result and not isinstance(result, Exception):
                        games_with_achievements += 1
                        total_achievements += result["achievements"]["total"]
                        unlocked_achievements += result["achievements"]["unlocked"]
                        processed_games += 1
                        
                        if result["is_perfect"]:
                            perfect_games.append({
                                "name": result["game"].get("name", f"App {result['game']['appid']}"),
                                "app_id": result["game"]["appid"],
                                "achievements": result["achievements"]["total"],
                                "playtime_forever": result["game"].get("playtime_forever", 0),
                                "header_image": result.get("header_image", "")
                            })
                
                # Small delay between batches to be respectful to Steam's API
                if i + batch_size < len(games):
                    await asyncio.sleep(0.5)
            
            average_completion = round((unlocked_achievements / total_achievements * 100) if total_achievements > 0 else 0, 1)
            
            result = {
                "total_games": len(games),
                "games_with_achievements": games_with_achievements,
                "total_achievements": total_achievements,
                "unlocked_achievements": unlocked_achievements,
                "average_completion": average_completion,
                "perfect_games": perfect_games,
                "perfect_games_count": len(perfect_games),
                "last_updated": int(time.time()),
                "processed_games": processed_games
            }
            
            # Cache the result
            await self.cache_service.save_progress_cache(result)
            
            # Validate and return
            result = validate_progress_data(result)
            decky.logger.info(f"Progress complete: {result['unlocked_achievements']}/{result['total_achievements']}")
            
            return result
                        
        except Exception as e:
            decky.logger.error(f"Failed to get achievement progress: {e}")
            return {"error": f"Failed to calculate progress: {str(e)}"}