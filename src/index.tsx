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
import { getCurrentGame, getAchievements } from "./services/api";

// Main Content Component
const Content: VFC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.CURRENT_GAME);
  const [currentGame, setCurrentGame] = useState<GameInfo | null>(null);
  const [trackedGame, setTrackedGame] = useState<TrackedGame | null>(null);
  const [trackedGameAchievements, setTrackedGameAchievements] = useState<AchievementData | null>(null);

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
    settings.loadPluginSettings();
    fetchCurrentGame().then(game => {
      if (game) {
        achievements.fetchAchievements(game.app_id);
      }
    });
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

  // Tracked game handlers
  const handleSetTrackedGame = (game: TrackedGame) => {
    setTrackedGame(game);
  };

  const handleClearTrackedGame = () => {
    setTrackedGame(null);
    setTrackedGameAchievements(null);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case Tab.CURRENT_GAME:
        return (
          <CurrentGameTab
            currentGame={currentGame}
            achievements={achievements.achievements}
            isLoading={achievements.isLoading}
            loadingMessage={achievements.loadingMessage}
            onRefreshGame={handleRefreshGame}
            onRefreshAchievements={handleRefreshAchievements}
          />
        );
      
      case Tab.RECENT:
        return (
          <RecentTab
            recentAchievements={achievements.recentAchievements}
            trackedGame={trackedGame}
            trackedGameAchievements={trackedGameAchievements}
            isLoading={achievements.isLoading}
            onFetchRecent={achievements.fetchRecentAchievements}
            onSetTrackedGame={handleSetTrackedGame}
            onClearTrackedGame={handleClearTrackedGame}
            onFetchTrackedAchievements={fetchTrackedGameAchievements}
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
            onFullRefresh={handleFullRefresh}
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