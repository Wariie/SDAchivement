import unittest
from unittest.mock import patch, MagicMock, mock_open, AsyncMock
import os
import json
from main import Plugin

class TestPlugin(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.plugin = Plugin()
        self.plugin.settings_file = MagicMock()
        self.plugin.cache_dir = MagicMock()
        self.plugin.steam_api_key = "E16D73DF90889602C0D0790413DED588"
        self.plugin.current_user_id = "67054786"

    @patch("builtins.open", new_callable=mock_open, read_data='{"steam_api_key": "test_key"}')
    @patch("os.path.exists", return_value=True)
    async def test_load_settings(self, mock_exists, mock_file):
        self.plugin.settings_file.exists.return_value = True
        settings = await self.plugin.load_settings()
        self.assertEqual(settings.get("steam_api_key"), "test_key")

    @patch("builtins.open", new_callable=mock_open)
    async def test_save_settings(self, mock_file):
        settings = {"steam_api_key": "new_key"}
        result = await self.plugin.save_settings(settings)
        self.assertTrue(result)
        self.assertEqual(self.plugin.steam_api_key, "new_key")

    async def test_set_steam_api_key(self):
        with patch.object(self.plugin, "save_settings", AsyncMock(return_value=True)):
            with patch.object(self.plugin, "load_settings", AsyncMock(return_value={})):
                result = await self.plugin.set_steam_api_key("another_key")
                self.assertTrue(result)
                self.assertEqual(self.plugin.steam_api_key, "another_key")

    async def test_set_test_game(self):
        result = await self.plugin.set_test_game(730)
        self.assertTrue(result)
        self.assertEqual(self.plugin.test_app_id, 730)

    async def test_set_steam_user_id(self):
        with patch.object(self.plugin, "save_settings", AsyncMock(return_value=True)):
            with patch.object(self.plugin, "load_settings", AsyncMock(return_value={})):
                result = await self.plugin.set_steam_user_id("76561198000000000")
                self.assertTrue(result)
                self.assertEqual(self.plugin.current_user_id, "76561198000000000")

    @patch("main.Plugin.get_current_game", AsyncMock(return_value={"app_id": 730}))
    async def test_get_current_game(self):
        game = await self.plugin.get_current_game()
        self.assertIsInstance(game, dict)
        self.assertEqual(game["app_id"], 730)

    @patch("main.Plugin.get_achievement_schema", AsyncMock(return_value={"achievements": [{"name": "ACH_WIN_ONE_GAME"}]}))
    @patch("main.Plugin.get_player_achievements", AsyncMock(return_value=[{"apiname": "ACH_WIN_ONE_GAME", "achieved": 1, "unlocktime": 1234567890}]))
    @patch("main.Plugin.get_global_achievement_stats", AsyncMock(return_value=[{"name": "ACH_WIN_ONE_GAME", "percent": 5.0}]))
    async def test_get_achievements(self):
        result = await self.plugin.get_achievements(app_id=730)
        self.assertIn("achievements", result)
        self.assertEqual(result["total"], 1)
        self.assertEqual(result["unlocked"], 1)
        self.assertEqual(result["achievements"][0]["global_percent"], 5.0)

    async def test_refresh_cache(self):
        self.plugin.achievement_cache = {"test": {}}
        self.plugin.last_cache_update = {"test": 123}
        result = await self.plugin.refresh_cache()
        self.assertTrue(result)
        self.assertEqual(self.plugin.achievement_cache, {})
        self.assertEqual(self.plugin.last_cache_update, {})

if __name__ == "__main__":
    unittest.main()