// services/api.ts
import { callable } from "@decky/api";
import {
  GameInfo,
  AchievementData,
  GameStats,
  RecentAchievement,
  OverallProgress,
  PluginSettings
} from "../models";

// Python backend callable functions
export const getCurrentGame = callable<[], GameInfo | null>("get_current_game");
export const getAchievements = callable<[app_id?: number], AchievementData>("get_achievements");
export const getGameStats = callable<[app_id?: number], GameStats>("get_game_stats");
export const getRecentAchievements = callable<[limit: number], RecentAchievement[]>("get_recent_achievements");
export const getAchievementProgress = callable<[], OverallProgress>("get_achievement_progress");
export const setSteamApiKey = callable<[api_key: string], boolean>("set_steam_api_key");
export const setTestGame = callable<[app_id: number], boolean>("set_test_game");
export const loadSettings = callable<[], PluginSettings>("load_settings");
export const refreshCache = callable<[app_id?: number], boolean>("refresh_cache");
export const clearTestGame = callable<[], boolean>("clear_test_game");
export const reloadSettings = callable<[], PluginSettings>("reload_settings");
export const saveRefreshIntervalBackend = callable<[interval: number], boolean>("set_refresh_interval");
export const saveAutoRefreshBackend = callable<[enabled: boolean], boolean>("set_auto_refresh");