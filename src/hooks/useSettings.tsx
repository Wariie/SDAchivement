// hooks/useSettings.tsx
import { useState, useCallback, useRef } from "react";
import { toaster } from "@decky/api";
import {
  loadSettings,
  setSteamApiKey,
  setSteamUserId,
  setTestGame,
  clearTestGame,
  reloadSettings,
  saveRefreshIntervalBackend,
  saveAutoRefreshBackend,
  refreshCache
} from "../services/api";
import { TrackedGame } from "../models";
import { logger } from "../utils/logger";
import { getSteamUser } from "../utils/steam_client";

export interface UseSettingsReturn {
  // State
  apiKeySet: boolean;
  steamUserId: string;
  autoRefresh: boolean;
  refreshInterval: number;
  testGameId: string;
  steamApiKey: string;
  trackedGame: TrackedGame | null;
  settingsLoaded: boolean;

  // Setters
  setSteamApiKeyState: (key: string) => void;
  setTestGameId: (id: string) => void;

  // Actions
  loadPluginSettings: () => Promise<void>;
  saveApiKey: (apiKey?: string) => Promise<boolean>;
  handleSetTestGame: () => Promise<boolean>;
  handleClearTestGame: () => Promise<boolean>;
  saveAutoRefresh: (enabled: boolean) => Promise<void>;
  saveRefreshInterval: (interval: number) => Promise<void>;
  handleReloadSettings: () => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
  const [apiKeySet, setApiKeySet] = useState(false);
  const [steamUserId, setSteamUserIdState] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false); // Default to disabled to reduce CPU usage
  const [refreshInterval, setRefreshInterval] = useState(60); // Default to 1 minute to reduce CPU usage
  const [testGameId, setTestGameId] = useState("");
  const [steamApiKey, setSteamApiKeyState] = useState("");
  const [trackedGame, setTrackedGame] = useState<TrackedGame | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const lastSavedInterval = useRef(30);

  const loadPluginSettings = useCallback(async () => {
    try {
      const result = await loadSettings();
      if (result) {
        setApiKeySet(!!result.steam_api_key);
        setSteamUserIdState(result.steam_user_id || "");
        setAutoRefresh(result.auto_refresh ?? false);
        setRefreshInterval(result.refresh_interval ?? 60);
        lastSavedInterval.current = result.refresh_interval ?? 60;
        if (result.test_app_id) {
          setTestGameId(result.test_app_id.toString());
        } else {
          setTestGameId("");
        }

        // Always set tracked game (including null/undefined to clear it)
        setTrackedGame(result.tracked_game || null);
        
        // Auto-detect Steam user ID if not set
        if (!result.steam_user_id) {
          try {
            const currentUser = await getSteamUser();
            if (currentUser && currentUser.strSteamID) {
              logger.info("Auto-detected Steam user ID:", currentUser.strSteamID);
              const success = await setSteamUserId(currentUser.strSteamID);
              if (success) {
                setSteamUserIdState(currentUser.strSteamID);
                logger.info("Steam user ID automatically configured");
              }
            }
          } catch (userError) {
            logger.warn("Failed to auto-detect Steam user ID:", userError);
          }
        }
        
        setSettingsLoaded(true);
      }
    } catch (error) {
      logger.error("Failed to load settings:", error);
    }
  }, []);

  const saveApiKey = useCallback(async (apiKey?: string) => {
    try {
      const keyToSave = apiKey || steamApiKey;

      const success = await setSteamApiKey(keyToSave);
      if (success) {
        // Update local state
        setSteamApiKeyState(keyToSave);
        setApiKeySet(true);

        // Clear cache since API key changed - fresh start with new key
        try {
          await refreshCache();
        } catch (cacheError) {
          logger.warn("Failed to clear cache after API key change", cacheError);
          // Don't fail the whole operation if cache clear fails
        }

        const reloaded = await loadSettings();
        if (reloaded) {
          setSteamUserIdState(reloaded.steam_user_id || "");
        }
        toaster.toast({
          title: "Success",
          body: "Steam API key saved and cache cleared!"
        });
        return true;
      } else {
        toaster.toast({
          title: "Error",
          body: "Failed to save API key",
          critical: true
        });
        return false;
      }
    } catch (error) {
      logger.error("Failed to save API key:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to save API key",
        critical: true
      });
      return false;
    }
  }, [steamApiKey]);

  const handleSetTestGame = useCallback(async () => {
    try {
      const appId = parseInt(testGameId);
      if (isNaN(appId)) {
        toaster.toast({
          title: "Invalid ID",
          body: "Please enter a valid number",
          critical: true
        });
        return false;
      }

      const success = await setTestGame(appId);
      if (success) {
        toaster.toast({
          title: "Test Game Set",
          body: `Testing with App ID: ${appId}`
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Failed to set test game:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to set test game",
        critical: true
      });
      return false;
    }
  }, [testGameId]);

  const handleClearTestGame = useCallback(async () => {
    try {
      const success = await clearTestGame();
      if (success) {
        toaster.toast({
          title: "Test Game Cleared",
          body: "Now detecting games normally"
        });
        setTestGameId("");
        return true;
      } else {
        toaster.toast({
          title: "Error",
          body: "Failed to clear test game",
          critical: true
        });
        return false;
      }
    } catch (error) {
      logger.error("Failed to clear test game:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to clear test game",
        critical: true
      });
      return false;
    }
  }, []);

  const saveAutoRefresh = useCallback(async (enabled: boolean) => {
    try {
      setAutoRefresh(enabled);

      try {
        const success = await saveAutoRefreshBackend(enabled);
        if (success) {
          toaster.toast({
            title: "Auto-Refresh Updated",
            body: enabled ? "Auto-refresh enabled" : "Auto-refresh disabled"
          });
        }
      } catch (backendError) {
      }
    } catch (error) {
      logger.error("Failed to save auto-refresh setting:", error);
    }
  }, []);

  const saveRefreshInterval = useCallback(async (interval: number) => {
    if (interval === lastSavedInterval.current) {
      setRefreshInterval(interval);
      return;
    }

    try {
      setRefreshInterval(interval);

      try {
        const success = await saveRefreshIntervalBackend(interval);
        if (success) {
          lastSavedInterval.current = interval;
          toaster.toast({
            title: "Refresh Interval Updated",
            body: `Auto-refresh set to ${interval < 60 ? `${interval} seconds` : `${interval / 60} minutes`}`
          });
        }
      } catch (backendError) {
      }
    } catch (error) {
      logger.error("Failed to save refresh interval:", error);
    }
  }, []);

  const handleReloadSettings = useCallback(async () => {
    try {
      const reloaded = await reloadSettings();
      if (reloaded && !reloaded.error) {
        setApiKeySet(!!reloaded.api_key_set);
        setSteamUserIdState(reloaded.steam_user_id || "");
        setAutoRefresh(reloaded.auto_refresh ?? false);
        setRefreshInterval(reloaded.refresh_interval ?? 60);
        lastSavedInterval.current = reloaded.refresh_interval ?? 60;
        if (reloaded.test_app_id) {
          setTestGameId(reloaded.test_app_id.toString());
        } else {
          setTestGameId("");
        }

        // Always set tracked game (including null/undefined to clear it)
        setTrackedGame(reloaded.tracked_game || null);
        setSettingsLoaded(true);
        toaster.toast({
          title: "Settings Reloaded",
          body: "Settings have been reloaded from disk"
        });
      } else {
        toaster.toast({
          title: "Error",
          body: reloaded?.error || "Failed to reload settings",
          critical: true
        });
      }
    } catch (error) {
      logger.error("Failed to reload settings:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to reload settings",
        critical: true
      });
    }
  }, []);

  return {
    // State
    apiKeySet,
    steamUserId,
    autoRefresh,
    refreshInterval,
    testGameId,
    steamApiKey,
    trackedGame,
    settingsLoaded,

    // Setters
    setSteamApiKeyState,
    setTestGameId,

    // Actions
    loadPluginSettings,
    saveApiKey,
    handleSetTestGame,
    handleClearTestGame,
    saveAutoRefresh,
    saveRefreshInterval,
    handleReloadSettings
  };
};