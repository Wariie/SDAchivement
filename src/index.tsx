// index.tsx - Final Refactored Main Entry Point
import { staticClasses, definePlugin } from "@decky/ui";
import { useState, useEffect, useCallback, VFC } from "react";
import { FaTrophy } from "react-icons/fa";

// Import types
import { Tab, GameInfo, TrackedGame, AchievementData } from "./models";

// Import components
import { TabNavigation } from "./components/common/TabNavigation";
import { CurrentGameTab } from "./components/tabs/CurrentGameTab";
import { RecentTab } from "./components/tabs/RecentTab";
import { OverallTab } from "./components/tabs/OverallTab";
import { SettingsTab } from "./components/tabs/SettingsTab";

// Import hooks
import { useSettings } from "./hooks/useSettings";
import { useAchievements } from "./hooks/useAchievements";

// Import services
import { getCurrentGame, getAchievements, setTrackedGame, clearTrackedGame, getInstalledGames } from "./services/api";

// Main Content Component
const Content: VFC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.CURRENT_GAME);
  const [currentGame, setCurrentGame] = useState<GameInfo | null>(null);
  const [trackedGame, setTrackedGame] = useState<TrackedGame | null>(null);
  const [trackedGameAchievements, setTrackedGameAchievements] = useState<AchievementData | null>(null);
  const [installedGames, setInstalledGames] = useState<GameInfo[]>([]);

  // Custom hooks
  const settings = useSettings();
  const achievements = useAchievements();

  // Fetch current game
  const fetchCurrentGame = useCallback(async (): Promise<GameInfo | null> => {
    try {
      const result = await getCurrentGame();
      if (result) {
        setCurrentGame(result);
        return result;
      }
    } catch (error) {
      console.error("Failed to fetch current game:", error);
    }
    return null;
  }, []);

  // Fetch tracked game achievements
  const fetchTrackedGameAchievements = useCallback(async () => {
    if (!trackedGame) return;
    
    try {
      const result = await getAchievements(trackedGame.app_id);
      if (result && !result.error) {
        setTrackedGameAchievements(result);
      }
    } catch (error) {
      console.error("Failed to fetch tracked game achievements:", error);
    }
  }, [trackedGame]);

  // Handle game refresh
  const handleRefreshGame = useCallback(async (): Promise<GameInfo | null> => {
    const game = await fetchCurrentGame();
    if (game) {
      await achievements.fetchAchievements(game.app_id);
    }
    return game;
  }, [fetchCurrentGame, achievements.fetchAchievements]);

  // Handle achievement refresh
  const handleRefreshAchievements = useCallback(async () => {
    if (currentGame) {
      await achievements.handleRefresh(currentGame.app_id);
    }
  }, [currentGame, achievements.handleRefresh]);

  // Handle full refresh (for settings changes)
  const handleFullRefresh = useCallback(async () => {
    const game = await fetchCurrentGame();
    if (game) {
      await achievements.fetchAchievements(game.app_id);
    }
    if (currentTab === Tab.RECENT) {
      await achievements.fetchRecentAchievements();
    }
    if (currentTab === Tab.OVERALL) {
      await achievements.fetchOverallProgress();
    }
  }, [currentTab, fetchCurrentGame, achievements.fetchAchievements, achievements.fetchRecentAchievements, achievements.fetchOverallProgress]);

  // Initial load
  useEffect(() => {
    const initializePlugin = async () => {
      try {
        // Load settings first
        await settings.loadPluginSettings();
        
        // Log tracked game for debugging
        console.log("Loaded tracked game from settings:", settings.trackedGame);
        
        // Load tracked game from settings after settings are loaded
        if (settings.trackedGame) {
          console.log("Setting tracked game:", settings.trackedGame);
          setTrackedGame(settings.trackedGame);
          
          // Also load achievements for tracked game
          try {
            const result = await getAchievements(settings.trackedGame.app_id);
            if (result && !result.error) {
              setTrackedGameAchievements(result);
              console.log("Loaded tracked game achievements");
            }
          } catch (error) {
            console.error("Failed to load tracked game achievements:", error);
          }
        }
        
        // Load current game
        const game = await fetchCurrentGame();
        if (game) {
          await achievements.fetchAchievements(game.app_id);
        }

        // Load installed games by scanning Steam installation
        try {
          console.log("Scanning for installed Steam games...");
          const installedGamesList = await getInstalledGames();
          console.log("getInstalledGames result:", installedGamesList);
          
          if (installedGamesList && Array.isArray(installedGamesList)) {
            setInstalledGames(installedGamesList);
            console.log(`Found ${installedGamesList.length} installed games`);
          } else {
            console.error("Failed to get installed games:", installedGamesList);
            // Fallback to perfect games if scanning fails
            if (achievements.overallProgress?.perfect_games) {
              setInstalledGames(achievements.overallProgress.perfect_games.slice(0, 50));
              console.log("Fallback: using perfect games");
            }
          }
        } catch (error) {
          console.error("Failed to scan installed games:", error);
        }
      } catch (error) {
        console.error("Failed to initialize plugin:", error);
      }
    };

    initializePlugin();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (settings.autoRefresh && currentTab === Tab.CURRENT_GAME) {
      const interval = setInterval(async () => {
        const game = await fetchCurrentGame();
        if (game) {
          await achievements.fetchAchievements(game.app_id);
        }
      }, settings.refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, settings.refreshInterval, currentTab, fetchCurrentGame, achievements.fetchAchievements]);

  // Tab change handler
  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    
    // Load data when switching tabs
    switch (tab) {
      case Tab.RECENT:
        if (achievements.recentAchievements.length === 0) {
          achievements.fetchRecentAchievements();
        }
        break;
      case Tab.OVERALL:
        if (!achievements.overallProgress) {
          achievements.fetchOverallProgress();
        }
        break;
      case Tab.SETTINGS:
        if (!settings.settingsLoaded) {
          settings.loadPluginSettings();
        }
        break;
    }
  };

  // Update installed games when overall progress changes (fallback if scan failed)
  useEffect(() => {
    if (achievements.overallProgress?.perfect_games && installedGames.length === 0) {
      // Fallback: try to scan installed games first, then use perfect games
      const tryLoadInstalledGames = async () => {
        try {
          console.log("Trying to load installed games as fallback...");
          const installedGamesList = await getInstalledGames();
          
          if (installedGamesList && Array.isArray(installedGamesList) && installedGamesList.length > 0) {
            setInstalledGames(installedGamesList);
            console.log(`Loaded ${installedGamesList.length} installed games as fallback`);
          } else {
            // Use perfect games as final fallback
            setInstalledGames(achievements.overallProgress.perfect_games.slice(0, 50));
            console.log(`Final fallback: using ${achievements.overallProgress.perfect_games.slice(0, 50).length} perfect games`);
          }
        } catch (error) {
          console.error("Fallback scan failed, using perfect games:", error);
          setInstalledGames(achievements.overallProgress.perfect_games.slice(0, 50));
        }
      };
      
      tryLoadInstalledGames();
    }
  }, [achievements.overallProgress, installedGames.length]);

  // Tracked game handlers
  const handleSetTrackedGame = async (game: TrackedGame) => {
    try {
      const success = await setTrackedGame(game.app_id, game.name);
      if (success) {
        setTrackedGame(game);
        // Also fetch achievements for the newly tracked game
        const result = await getAchievements(game.app_id);
        if (result && !result.error) {
          setTrackedGameAchievements(result);
        }
      }
    } catch (error) {
      console.error("Failed to save tracked game:", error);
    }
  };

  const handleClearTrackedGame = async () => {
    try {
      const success = await clearTrackedGame();
      if (success) {
        setTrackedGame(null);
        setTrackedGameAchievements(null);
      }
    } catch (error) {
      console.error("Failed to clear tracked game:", error);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case Tab.CURRENT_GAME:
        return (
          <CurrentGameTab
            currentGame={currentGame}
            achievements={achievements.achievements}
            trackedGame={trackedGame}
            trackedGameAchievements={trackedGameAchievements}
            installedGames={installedGames}
            isLoading={achievements.isLoading}
            loadingMessage={achievements.loadingMessage}
            onRefreshGame={handleRefreshGame}
            onRefreshAchievements={handleRefreshAchievements}
            onSetTrackedGame={handleSetTrackedGame}
            onClearTrackedGame={handleClearTrackedGame}
            onFetchTrackedAchievements={fetchTrackedGameAchievements}
          />
        );
      
      case Tab.RECENT:
        return (
          <RecentTab
            recentAchievements={achievements.recentAchievements}
            isLoading={achievements.isLoading}
            onFetchRecent={achievements.fetchRecentAchievements}
          />
        );
      
      case Tab.OVERALL:
        return (
          <OverallTab
            overallProgress={achievements.overallProgress}
            isLoading={achievements.isLoading}
            onFetchProgress={achievements.fetchOverallProgress}
            onGameClick={(gameId) => {
              // Could navigate to game details or set as tracked game
              console.log("Game clicked:", gameId);
            }}
          />
        );
      
      case Tab.SETTINGS:
        return (
          <SettingsTab
            settings={settings}
            installedGames={installedGames}
            trackedGame={trackedGame}
            onFullRefresh={handleFullRefresh}
            onSetTrackedGame={handleSetTrackedGame}
            onClearTrackedGame={handleClearTrackedGame}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <TabNavigation 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
      />
      {renderTabContent()}
    </>
  );
};

// Plugin Definition
export default definePlugin(() => {
  console.log("SDAchievement initializing");

  return {
    name: "SDAchievement",
    titleView: <div className={staticClasses.Title}>SDAchievement</div>,
    content: <Content />,
    icon: <FaTrophy />,
    onDismount() {
      console.log("SDAchievement unloading");
    },
  };
});