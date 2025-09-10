import { AppAchievementResponse } from "@decky/ui/dist/globals/steam-client/App";
import { CurrentUser } from "@decky/ui/dist/globals/steam-client/User";
import { Achievement, GameInfo, AchievementData } from "../models";
import { logger } from "./logger";

// Steam Client API utilities for direct Steam integration

export class SteamClientAPI {
  private achievementCallbacks = new Map<number, (data: any) => void>();
  private gameStateCallbacks = new Set<(games: GameInfo[]) => void>();
  private userCallbacks = new Set<(user: CurrentUser) => void>();

  constructor() {
    this.setupCallbacks();
  }

  private setupCallbacks() {
    if (window.SteamClient?.Apps) {
      // Register for achievement changes
      window.SteamClient.Apps.RegisterForAchievementChanges((data: ArrayBuffer) => {
        // Handle achievement change notifications
        this.achievementCallbacks.forEach(callback => callback(data));
      });

      // Register for app overview changes (game state)
      window.SteamClient.Apps.RegisterForAppOverviewChanges((data: ArrayBuffer) => {
        this.handleAppOverviewChanges(data);
      });
    }

    if (window.SteamClient?.User) {
      // Register for user changes
      window.SteamClient.User.RegisterForCurrentUserChanges((user: CurrentUser) => {
        this.userCallbacks.forEach(callback => callback(user));
      });
    }
  }

  private handleAppOverviewChanges(_data: ArrayBuffer) {
    // Process app overview changes and notify callbacks
    // This would need proper protobuf deserialization in a real implementation
    this.gameStateCallbacks.forEach(callback => {
      // For now, we'll call the callback with empty data
      // In practice, you'd deserialize the protobuf data
      callback([]);
    });
  }

  /**
   * Get current Steam user information
   */
  async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      if (!window.SteamClient?.User) return null;
      
      return new Promise((resolve) => {
        window.SteamClient.User.RegisterForCurrentUserChanges((user: CurrentUser) => {
          resolve(user);
        });
      });
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Get achievements for a specific app
   */
  async getMyAchievementsForApp(appId: number): Promise<AchievementData | null> {
    try {
      if (!window.SteamClient?.Apps?.GetMyAchievementsForApp) return null;

      const response: AppAchievementResponse = await window.SteamClient.Apps.GetMyAchievementsForApp(appId.toString());
      
      if (response.result === 1 && response.data?.rgAchievements) { // EResult.OK = 1
        const achievements: Achievement[] = response.data.rgAchievements.map(achievement => ({
          api_name: achievement.strID,
          display_name: achievement.strName,
          description: achievement.strDescription,
          icon: achievement.strImage,
          icon_gray: achievement.strImage, // Use same icon for now
          hidden: achievement.bHidden,
          unlocked: achievement.bAchieved,
          unlock_time: achievement.rtUnlocked || null,
          global_percent: achievement.flAchieved || null
        }));

        const unlocked = achievements.filter(a => a.unlocked).length;
        const total = achievements.length;
        const percentage = total > 0 ? (unlocked / total) * 100 : 0;

        return {
          app_id: appId,
          total,
          unlocked,
          percentage: Math.round(percentage * 100) / 100,
          achievements
        };
      }
      
      // Check for specific result codes
      if (response.result === 2) { // EResult.Fail
        logger.debug(`App ${appId} returned EResult.Fail - likely no achievement registration`);
        return null;
      }
      
      return null;
    } catch (error) {
      // Check for specific error cases
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.result === 2 && errorObj.message?.includes('no registration for app details')) {
          logger.debug(`App ${appId} has no achievement registration, skipping`);
          return null;
        }
      }
      
      logger.error(`Failed to get achievements for app ${appId}:`, error);
      return null;
    }
  }

  /**
   * Get achievements in a time range
   */
  async getAchievementsInTimeRange(appId: number, startTime: number, endTime: number): Promise<Achievement[] | null> {
    try {
      if (!window.SteamClient?.Apps?.GetAchievementsInTimeRange) return null;

      const steamAchievements = await window.SteamClient.Apps.GetAchievementsInTimeRange(appId, startTime, endTime);
      
      if (steamAchievements) {
        return steamAchievements.map(achievement => ({
          api_name: achievement.strID,
          display_name: achievement.strName,
          description: achievement.strDescription,
          icon: achievement.strImage,
          icon_gray: achievement.strImage,
          hidden: achievement.bHidden,
          unlocked: achievement.bAchieved,
          unlock_time: achievement.rtUnlocked || null,
          global_percent: achievement.flAchieved || null
        }));
      }
      
      return null;
    } catch (error) {
      // Check for specific error cases
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.result === 2 && errorObj.message?.includes('no registration for app details')) {
          logger.debug(`App ${appId} has no achievement registration, skipping`);
          return null;
        }
      }
      
      logger.error(`Failed to get achievements in time range for app ${appId}:`, error);
      return null;
    }
  }

  /**
   * Get cached app details
   */
  async getCachedAppDetails(appId: number): Promise<GameInfo | null> {
    try {
      if (!window.SteamClient?.Apps?.GetCachedAppDetails) return null;

      const detailsStr = await window.SteamClient.Apps.GetCachedAppDetails(appId);
      if (!detailsStr) return null;

      const details = JSON.parse(detailsStr);
      
      // Better name handling - try multiple fields
      const name = details.strDisplayName || 
                   details.strName || 
                   details.name || 
                   details.strAppName || 
                   `App ${appId}`;

      // Convert to GameInfo format
      return {
        app_id: appId,
        name: name,
        is_running: details.eDisplayStatus === 5, // EDisplayStatus.Running = 5
        has_achievements: details.achievements?.nTotal > 0,
        total_achievements: details.achievements?.nTotal || 0,
        unlocked_achievements: details.achievements?.nAchieved || 0,
        achievement_percentage: details.achievements?.nTotal > 0 
          ? Math.round((details.achievements.nAchieved / details.achievements.nTotal) * 100 * 100) / 100
          : 0,
        playtime_forever: details.nPlaytimeForever || 0,
        header_image: details.libraryAssets?.strHeroImage || "",
        img_icon_url: "", // Not available in cached details
        img_logo_url: details.libraryAssets?.strLogoImage || ""
      };
    } catch (error) {
      logger.error(`Failed to get cached app details for app ${appId}:`, error);
      return null;
    }
  }

  /**
   * Get playtime for an app
   */
  async getPlaytime(appId: number): Promise<{ nPlaytimeForever: number; nPlaytimeLastTwoWeeks: number; rtLastTimePlayed: number } | null> {
    try {
      if (!window.SteamClient?.Apps?.GetPlaytime) return null;

      const playtime = await window.SteamClient.Apps.GetPlaytime(appId);
      return playtime || null;
    } catch (error) {
      logger.error(`Failed to get playtime for app ${appId}:`, error);
      return null;
    }
  }

  /**
   * Register callback for achievement changes
   */
  onAchievementChanges(appId: number, callback: (data: any) => void): () => void {
    this.achievementCallbacks.set(appId, callback);
    
    return () => {
      this.achievementCallbacks.delete(appId);
    };
  }

  /**
   * Register callback for game state changes
   */
  onGameStateChanges(callback: (games: GameInfo[]) => void): () => void {
    this.gameStateCallbacks.add(callback);
    
    return () => {
      this.gameStateCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for user changes
   */
  onUserChanges(callback: (user: CurrentUser) => void): () => void {
    this.userCallbacks.add(callback);
    
    return () => {
      this.userCallbacks.delete(callback);
    };
  }

  /**
   * Check if SteamClient APIs are available
   */
  isAvailable(): boolean {
    return typeof window.SteamClient !== 'undefined' && 
           window.SteamClient.Apps !== undefined &&
           window.SteamClient.User !== undefined;
  }

  /**
   * Get Steam client version info
   */
  getClientInfo(): { available: boolean; hasApps: boolean; hasUser: boolean; hasStats: boolean } {
    return {
      available: typeof window.SteamClient !== 'undefined',
      hasApps: window.SteamClient?.Apps !== undefined,
      hasUser: window.SteamClient?.User !== undefined,
      hasStats: window.SteamClient?.Stats !== undefined
    };
  }
}

// Export singleton instance
export const steamClientAPI = new SteamClientAPI();

// Export utility functions for easy access
export const getSteamUser = () => steamClientAPI.getCurrentUser();
export const getAppDetails = (appId: number) => steamClientAPI.getCachedAppDetails(appId);
export const isSteamClientAvailable = () => steamClientAPI.isAvailable();