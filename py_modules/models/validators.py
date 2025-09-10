"""
Data validation functions for achievement data
"""
import decky
from typing import Dict

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
        
        if "error" in data:
            validated["error"] = data["error"]
            
        decky.logger.debug(
            f"Validated progress data: {validated['unlocked_achievements']}"
            f"/{validated['total_achievements']} ({validated['average_completion']}%)"
        )
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