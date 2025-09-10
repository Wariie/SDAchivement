// services/hybridApi.tsx
import { GameInfo, AchievementData, PluginSettings, RecentAchievement, OverallProgress } from "../models";
import * as pythonApi from "./api";
import { 
  steamClientAPI, 
  isSteamClientAvailable, 
  getSteamUser,
  getAppDetails
} from "../utils/steam_client";
import { STEAM_API_DEFAULTS } from "../constants/steam";
import { logger } from "../utils/logger";

export class HybridSteamAPI {
  
  private steamClientAvailable: boolean;

  constructor() {
    this.steamClientAvailable = isSteamClientAvailable();
  }

  /**
   * Get current game
   */
  async getCurrentGame(): Promise<GameInfo | null> {
    return await pythonApi.getCurrentGame();
  }

  /**
   * Get achievements - Use Python backend for consistent data with global percentages
   */
  async getAchievements(appId?: number): Promise<AchievementData> {
    const targetAppId = appId || (await this.getCurrentGame())?.app_id;
    
    if (!targetAppId) {
      return { error: "No game running and no app ID provided" } as AchievementData;
    }

    // Use Python backend which includes global percentage data
    try {
      const result = await pythonApi.getAchievements(targetAppId);
      if (result && !result.error) {
        return result;
      }
    } catch (error) {
      logger.warn('Python backend getAchievements failed:', error);
    }

    // Fallback to Steam client if backend fails
    try {
      const steamResult = await steamClientAPI.getMyAchievementsForApp(targetAppId);
      if (steamResult) {
        return steamResult;
      }
    } catch (error) {
      logger.warn('SteamClient getMyAchievementsForApp failed:', error);
    }

    // No data available
    return { error: "Achievement data not available" } as AchievementData; 
  }

  /**
   * Get game info - Use SteamClient cache when available, enhanced with playtime
   */
  async getGameInfo(appId: number): Promise<GameInfo | null> {
    // Try SteamClient (faster cache access)
    if (this.steamClientAvailable) {
      try {
        const steamResult = await getAppDetails(appId);
        if (steamResult) {
          // Enhance with playtime data if not already present
          if (!steamResult.playtime_forever) {
            try {
              const playtimeData = await steamClientAPI.getPlaytime(appId);
              if (playtimeData) {
                return {
                  ...steamResult,
                  playtime_forever: Math.floor(playtimeData.nPlaytimeForever / 60), // Convert seconds to minutes
                  playtime_2weeks: Math.floor(playtimeData.nPlaytimeLastTwoWeeks / 60)
                };
              }
            } catch (playtimeError) {
              logger.warn('Failed to get playtime data:', playtimeError);
            }
          }
          return steamResult;
        }
      } catch (error) {
        logger.warn('SteamClient getGameInfo failed:', error);
      }
    }

    return null;
  }

  /**
   * Get current Steam user
   */
  async getCurrentUser(): Promise<{ strSteamID: string; strAccountName: string } | null> {
    if (this.steamClientAvailable) {
      try {
        const user = await getSteamUser();
        if (user) {
          return {
            strSteamID: user.strSteamID,
            strAccountName: user.strAccountName
          };
        }
      } catch (error) {
        logger.warn('SteamClient getCurrentUser failed:', error);
      }
    }
    
    return null; // Python backend handles user detection differently
  }

  /**
   * Settings management - Always use Python backend
   */
  async loadSettings(): Promise<PluginSettings> {
    return await pythonApi.loadSettings();
  }

  async setSteamApiKey(apiKey: string): Promise<boolean> {
    return await pythonApi.setSteamApiKey(apiKey);
  }

  async setTrackedGame(appId: number, name: string): Promise<boolean> {
    return await pythonApi.setTrackedGame(appId, name);
  }

  async clearTrackedGame(): Promise<boolean> {
    return await pythonApi.clearTrackedGame();
  }

  /**
   * Get installed games - Use Python file scanning (more reliable)
   */
  async getInstalledGames(): Promise<GameInfo[]> {
    return await pythonApi.getInstalledGames();
  }

  /**
   * Get games list - Use full library if API key available, otherwise installed games (with caching)
   */
  async getGames(): Promise<GameInfo[]> {
    
    // Try to get full user library first (requires Steam API key)
    try {
      const userGames = await pythonApi.getUserGames();
      if (userGames?.length > 0) {
        return userGames;
      }
    } catch (error) {
      logger.warn('Failed to get user games (likely no API key), falling back to installed games:', error);
    }
    
    // Fallback to installed games (local scanning)
    try {
      const installedGames = await pythonApi.getInstalledGames();
      return installedGames;
    } catch (error) {
      logger.error('Failed to get any games:', error);
      return [];
    }
  }

  /**
   * Get recent achievements - Use Python backend (faster and more reliable)
   * Note: Steam API has 5-15 minute delay for new achievements
   */
  async getRecentAchievements(limit: number = STEAM_API_DEFAULTS.RECENT_ACHIEVEMENTS_LIMIT, forceRefresh: boolean = false): Promise<RecentAchievement[]> {
    if (forceRefresh) {
      logger.info('Force refreshing recent achievements');
    }

    // Use Python backend (faster and more reliable)
    logger.info('Using Python backend for recent achievements');
    try {
      const pythonResult = await pythonApi.getRecentAchievements(limit);
      
      if (pythonResult?.length > 0) {
        // Convert from Python format to RecentAchievement format
        const mapped = pythonResult.map((achievement: any) => ({
          game_name: achievement.game_name || 'Unknown Game',
          game_id: achievement.game_id || achievement.app_id || 0,
          achievement_name: achievement.achievement_name || achievement.display_name,
          achievement_desc: achievement.achievement_desc || achievement.description,
          unlock_time: achievement.unlock_time || 0,
          icon: achievement.icon,
          global_percent: achievement.global_percent || 0
        }));
        
        return mapped;
      }
    } catch (error) {
      logger.warn('Python backend getRecentAchievements failed:', error);
    }

    // Return empty data when Python fails
    return [];
  }

  /**
   * Get recently played games - Use Python backend (faster and more reliable)
   */
  async getRecentlyPlayedGames(count: number = STEAM_API_DEFAULTS.RECENT_GAMES_COUNT): Promise<GameInfo[]> {
    // Use Python backend (faster and more reliable)
    logger.info('Using Python backend for recently played games');
    try {
      const pythonResult = await pythonApi.getRecentlyPlayedGames(count);
      
      if (pythonResult?.length > 0) {
        return pythonResult;
      }
    } catch (error) {
      logger.warn('Python backend getRecentlyPlayedGames failed:', error);
    }

    // No data available
    return [];
  }

  /**
   * Get overall achievement progress - Use Python backend with caching and fast processing
   */
  async getAchievementProgress(forceRefresh: boolean = false): Promise<OverallProgress> {
    logger.info('Using Python backend for overall progress calculation');
    try {
      const pythonResult = await pythonApi.getAchievementProgress(forceRefresh);
      
      if (pythonResult && !pythonResult.error) {
        return {
          total_games: pythonResult.total_games || 0,
          games_with_achievements: pythonResult.games_with_achievements || 0,
          total_achievements: pythonResult.total_achievements || 0,
          unlocked_achievements: pythonResult.unlocked_achievements || 0,
          average_completion: pythonResult.average_completion || 0,
          perfect_games: pythonResult.perfect_games || [],
          perfect_games_count: pythonResult.perfect_games_count || 0
        };
      }
    } catch (error) {
      logger.warn('Python backend getAchievementProgress failed:', error);
    }

    // Return empty progress data
    return {
      total_games: 0,
      games_with_achievements: 0,
      total_achievements: 0,
      unlocked_achievements: 0,
      average_completion: 0,
      perfect_games: [],
      perfect_games_count: 0
    };
  }

  /**
   * Check if running in Desktop Mode
   */
  async isDesktopMode(): Promise<boolean> {
    return await pythonApi.isDesktopMode();
  }

  /**
   * Refresh achievement cache
   */
  async refreshCache(appId?: number): Promise<boolean> {
    // Backend handles all caching - just call backend refresh
    return await pythonApi.refreshCache(appId);
  }


  /**
   * Setup real-time achievement monitoring
   */
  monitorAchievements(appId: number, callback: (data: AchievementData) => void): () => void {
    if (!this.steamClientAvailable) {
      return () => {}; // No monitoring available
    }

    return steamClientAPI.onAchievementChanges(appId, async () => {
      const updated = await this.getAchievements(appId);
      if (updated && !updated.error) {
        callback(updated);
      }
    });
  }

  /**
   * Get API capabilities
   */
  getCapabilities() {
    return {
      steamClientAvailable: this.steamClientAvailable,
      realTimeAchievements: this.steamClientAvailable,
      realTimeGameState: this.steamClientAvailable,
      fileSystemAccess: true,
      clientInfo: this.steamClientAvailable ? steamClientAPI.getClientInfo() : null
    };
  }
}

// Export singleton instance
export const hybridAPI = new HybridSteamAPI();

// Export individual functions for backward compatibility
export const getCurrentGame = () => hybridAPI.getCurrentGame();
export const getAchievements = (appId?: number) => hybridAPI.getAchievements(appId);
export const getGameInfo = (appId: number) => hybridAPI.getGameInfo(appId);
export const loadSettings = () => hybridAPI.loadSettings();
export const setSteamApiKey = (apiKey: string) => hybridAPI.setSteamApiKey(apiKey);
export const setTrackedGame = (appId: number, name: string) => hybridAPI.setTrackedGame(appId, name);
export const clearTrackedGame = () => hybridAPI.clearTrackedGame();
export const getInstalledGames = () => hybridAPI.getInstalledGames();
export const getGames = () => hybridAPI.getGames();
export const getRecentAchievements = (limit: number = STEAM_API_DEFAULTS.RECENT_ACHIEVEMENTS_LIMIT, forceRefresh: boolean = false) => hybridAPI.getRecentAchievements(limit, forceRefresh);
export const getRecentlyPlayedGames = (count: number = STEAM_API_DEFAULTS.RECENT_GAMES_COUNT) => hybridAPI.getRecentlyPlayedGames(count);
export const getAchievementProgress = (forceRefresh: boolean = false) => hybridAPI.getAchievementProgress(forceRefresh);
export const refreshCache = (appId?: number) => hybridAPI.refreshCache(appId);
export const isDesktopMode = () => hybridAPI.isDesktopMode();