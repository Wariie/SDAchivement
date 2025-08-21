import sys
import os
import unittest
import asyncio
from unittest.mock import AsyncMock, patch


# Add pymodules directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "py_modules")))

from steam_api import SteamAPI

def async_test(f):
    """Decorator to run async tests inside unittest."""
    def wrapper(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))
    return wrapper


class TestSteamAPI(unittest.TestCase):

    @async_test
    async def test_get_player_summaries_mocked(self):
        fake_response = {
            "response": {
                "players": [
                    {"steamid": "123456", "personaname": "TestUser"}
                ]
            }
        }
        async with SteamAPI("FAKE_KEY", "123456") as api:
            with patch.object(api, "_get", new=AsyncMock(return_value=fake_response)):
                result = await api.get_player_summaries()
                self.assertIn("players", result["response"])
                self.assertEqual(result["response"]["players"][0]["personaname"], "TestUser")

    @async_test
    async def test_get_owned_games_mocked(self):
        fake_response = {
            "response": {
                "game_count": 1,
                "games": [
                    {"appid": 620, "name": "Portal 2"}
                ]
            }
        }
        async with SteamAPI("FAKE_KEY", "123456") as api:
            with patch.object(api, "_get", new=AsyncMock(return_value=fake_response)):
                result = await api.get_owned_games()
                self.assertEqual(result["response"]["game_count"], 1)
                self.assertEqual(result["response"]["games"][0]["name"], "Portal 2")

    @async_test
    async def test_get_app_details_mocked(self):
        fake_response = {
            "620": {
                "success": True,
                "data": {"name": "Portal 2", "type": "game"}
            }
        }
        async with SteamAPI() as api:  # Store API doesn’t need key
            with patch.object(api, "_get", new=AsyncMock(return_value=fake_response)):
                result = await api.get_app_details(620)
                self.assertTrue(result["620"]["success"])
                self.assertEqual(result["620"]["data"]["name"], "Portal 2")

    @async_test
    async def test_no_api_key_returns_none(self):
        async with SteamAPI() as api:
            result = await api.get_player_summaries("123456")
            self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
