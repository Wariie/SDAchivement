// services/api.ts
import { callable } from "@decky/api";
import {
  GameInfo,
  PluginSettings
} from "../models";

// Python backend callable functions

// Game Detection
export const getCurrentGame = callable<[], GameInfo | null>("get_current_game");
export const getAchievements = callable<[app_id: number], any>("get_achievements");
export const getRecentAchievements = callable<[limit: number], any[]>("get_recent_achievements");
export const getRecentlyPlayedGames = callable<[count: number], GameInfo[]>("get_recently_played_games");
export const getInstalledGames = callable<[], GameInfo[]>("get_installed_games");
export const getUserGames = callable<[], GameInfo[]>("get_user_games");
export const getGameArtwork = callable<[app_id: number], Record<string, string | null>>("get_game_artwork");
export const getSteamGridDBArtwork = callable<[app_id: number], Record<string, string | null>>("get_steamgriddb_artwork");

// Settings Management  
export const loadSettings = callable<[], PluginSettings>("load_settings");
export const refreshCache = callable<[app_id?: number], boolean>("refresh_cache");
export const clearTestGame = callable<[], boolean>("clear_test_game");
export const reloadSettings = callable<[], PluginSettings>("reload_settings");
export const saveRefreshIntervalBackend = callable<[interval: number], boolean>("set_refresh_interval");
export const saveAutoRefreshBackend = callable<[enabled: boolean], boolean>("set_auto_refresh");
export const setTrackedGame = callable<[app_id: number, name: string], boolean>("set_tracked_game");
export const clearTrackedGame = callable<[], boolean>("clear_tracked_game");
export const setSteamApiKey = callable<[api_key: string], boolean>("set_steam_api_key");
export const setTestGame = callable<[app_id: number], boolean>("set_test_game");

export const isDesktopMode = callable<[], boolean>("is_desktop_mode");

// Achievement Progress
export const getAchievementProgress = callable<[force_refresh?: boolean], any>("get_achievement_progress");

