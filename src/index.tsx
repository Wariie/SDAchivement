import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Navigation,
  staticClasses,
  DialogButton,
  ProgressBar,
  ProgressBarWithInfo,
  ToggleField,
  TextField,
  Focusable,
  Menu,
  MenuItem,
  showContextMenu,
  ConfirmModal,
  showModal
} from "@decky/ui";
import {
  addEventListener,
  removeEventListener,
  callable,
  definePlugin,
  toaster
} from "@decky/api";
import { useState, useEffect, useCallback } from "react";
import { FaTrophy, FaGamepad, FaClock, FaStar, FaSync, FaKey, FaCheck, FaLock, FaPercent, FaChartLine } from "react-icons/fa";

// Type definitions
interface Achievement {
  api_name: string;
  display_name: string;
  description: string;
  icon: string;
  icon_gray: string;
  hidden: boolean;
  unlocked: boolean;
  unlock_time: number | null;
  global_percent: number | null;
}

interface AchievementData {
  app_id: number;
  total: number;
  unlocked: number;
  percentage: number;
  achievements: Achievement[];
  error?: string;
}

interface GameInfo {
  app_id: number;
  name: string;
  is_running: boolean;
  has_achievements: boolean;
  achievement_count: number;
}

interface GameStats {
  app_id: number;
  stats: Record<string, number>;
  error?: string;
}

interface RecentAchievement {
  game_name: string;
  game_id: number;
  achievement_name: string;
  achievement_desc: string;
  unlock_time: number;
  icon: string;
  global_percent: number;
}

interface OverallProgress {
  total_games: number;
  games_with_achievements: number;
  total_achievements: number;
  unlocked_achievements: number;
  average_completion: number;
  perfect_games: Array<{
    name: string;
    app_id: number;
    achievements: number;
  }>;
  perfect_games_count: number;
  error?: string;
}

// Tab enum
enum Tab {
  CURRENT_GAME = "current",
  RECENT = "recent",
  OVERALL = "overall",
  SETTINGS = "settings"
}

// Python backend callable functions
const getCurrentGame = callable<[], GameInfo | null>("get_current_game");
const getAchievements = callable<[app_id?: number], AchievementData>("get_achievements");
const getGameStats = callable<[app_id?: number], GameStats>("get_game_stats");
const getRecentAchievements = callable<[limit: number], RecentAchievement[]>("get_recent_achievements");
const getAchievementProgress = callable<[], OverallProgress>("get_achievement_progress");
const setSteamApiKey = callable<[api_key: string], boolean>("set_steam_api_key");
const loadSettings = callable<[], any>("load_settings");
const saveSettings = callable<[settings: any], boolean>("save_settings");
const refreshCache = callable<[app_id?: number], boolean>("refresh_cache");

// Main content component
function Content() {
  // State management
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.CURRENT_GAME);
  const [currentGame, setCurrentGame] = useState<GameInfo | null>(null);
  const [achievements, setAchievements] = useState<AchievementData | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [overallProgress, setOverallProgress] = useState<OverallProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "unlock" | "rarity">("unlock");
  const [filterRarity, setFilterRarity] = useState(0);
  const [steamApiKey, setSteamApiKeyState] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);

  // Fetch current game
  const fetchCurrentGame = useCallback(async () => {
    try {
      const result = await getCurrentGame();
      if (result) {
        setCurrentGame(result);
        return result;
      }
    } catch (error) {
      console.error("Failed to fetch current game:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to fetch current game",
        critical: true
      });
    }
    return null;
  }, []);

  // Fetch achievements for a game
  const fetchAchievements = useCallback(async (appId?: number) => {
    setIsLoading(true);
    try {
      const result = await getAchievements(appId);
      if (result && !result.error) {
        setAchievements(result);
      } else if (result?.error) {
        toaster.toast({
          title: "Achievement Error",
          body: result.error,
          critical: true
        });
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch game statistics
  const fetchGameStats = useCallback(async (appId?: number) => {
    try {
      const result = await getGameStats(appId);
      if (result && !result.error) {
        setGameStats(result);
      }
    } catch (error) {
      console.error("Failed to fetch game stats:", error);
    }
  }, []);

  // Fetch recent achievements
  const fetchRecentAchievements = useCallback(async () => {
    try {
      const result = await getRecentAchievements(20);
      if (result) {
        setRecentAchievements(result);
      }
    } catch (error) {
      console.error("Failed to fetch recent achievements:", error);
    }
  }, []);

  // Fetch overall progress
  const fetchOverallProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAchievementProgress();
      if (result && !result.error) {
        setOverallProgress(result);
      }
    } catch (error) {
      console.error("Failed to fetch overall progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load settings
  const loadPluginSettings = useCallback(async () => {
    try {
      const result = await loadSettings();
      if (result) {
        setApiKeySet(!!result.steam_api_key);
        setAutoRefresh(result.auto_refresh ?? true);
        setRefreshInterval(result.refresh_interval ?? 30);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  // Save API key
  const saveApiKey = useCallback(async () => {
    try {
      await setSteamApiKey(steamApiKey);
      setApiKeySet(true);
      toaster.toast({
        title: "Success",
        body: "Steam API key saved successfully!"
      });
      // Refresh data with new API key
      await handleFullRefresh();
    } catch (error) {
      console.error("Failed to save API key:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to save API key",
        critical: true
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steamApiKey]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refreshCache(currentGame?.app_id);
      if (currentGame) {
        await fetchAchievements(currentGame.app_id);
        await fetchGameStats(currentGame.app_id);
      }
      toaster.toast({
        title: "Refreshed",
        body: "Achievement data updated"
      });
    } catch (error) {
      console.error("Failed to refresh:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame]);

  // Full data refresh
  const handleFullRefresh = useCallback(async () => {
    const game = await fetchCurrentGame();
    if (game) {
      await fetchAchievements(game.app_id);
      await fetchGameStats(game.app_id);
    }
    await fetchRecentAchievements();
    await fetchOverallProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load
  useEffect(() => {
    loadPluginSettings();
    handleFullRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && currentTab === Tab.CURRENT_GAME) {
      const interval = setInterval(async () => {
        const game = await fetchCurrentGame();
        if (game) {
          await fetchAchievements(game.app_id);
        }
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, currentTab]);

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Sort and filter achievements
  const getSortedAchievements = (): Achievement[] => {
    if (!achievements?.achievements) return [];
    
    let filtered = [...achievements.achievements];
    
    // Filter by rarity
    if (filterRarity > 0) {
      filtered = filtered.filter(a => a.global_percent && a.global_percent <= filterRarity);
    }
    
    // Filter hidden if not showing
    if (!showHidden) {
      filtered = filtered.filter(a => !a.hidden || a.unlocked);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.display_name.localeCompare(b.display_name);
        case "rarity":
          return (a.global_percent || 100) - (b.global_percent || 100);
        case "unlock":
        default:
          // Unlocked first, then by time
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          if (a.unlocked && b.unlocked) {
            return (b.unlock_time || 0) - (a.unlock_time || 0);
          }
          return 0;
      }
    });
    
    return filtered;
  };

  // Render achievement item
  const AchievementItem = ({ achievement }: { achievement: Achievement }) => (
    <PanelSectionRow>
      <ButtonItem
        layout="below"
        onClick={() => {
          showContextMenu(
            <Menu label={achievement.display_name}>
              <MenuItem>{achievement.description || "Hidden achievement"}</MenuItem>
              {achievement.global_percent !== null && (
                <MenuItem>
                  <FaPercent /> {achievement.global_percent.toFixed(1)}% of players
                </MenuItem>
              )}
              {achievement.unlocked && achievement.unlock_time && (
                <MenuItem>
                  <FaClock /> Unlocked: {formatTime(achievement.unlock_time)}
                </MenuItem>
              )}
            </Menu>
          );
        }}
      >
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          opacity: achievement.unlocked ? 1 : 0.6
        }}>
          {/* Achievement Icon */}
          {achievement.icon && (
            <img 
              src={achievement.unlocked ? achievement.icon : achievement.icon_gray} 
              style={{ width: "32px", height: "32px", borderRadius: "4px" }}
              alt=""
            />
          )}
          
          {/* Achievement Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: achievement.unlocked ? "bold" : "normal",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              {achievement.display_name}
              {achievement.unlocked && <FaCheck style={{ color: "#4CAF50", fontSize: "12px" }} />}
              {achievement.hidden && !achievement.unlocked && <FaLock style={{ fontSize: "12px", opacity: 0.5 }} />}
            </div>
            <div style={{ 
              fontSize: "12px", 
              opacity: 0.7,
              marginTop: "2px"
            }}>
              {!achievement.hidden || achievement.unlocked 
                ? achievement.description 
                : "Hidden achievement"}
            </div>
          </div>
          
          {/* Rarity indicator */}
          {achievement.global_percent !== null && achievement.global_percent <= 10 && (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              minWidth: "40px"
            }}>
              <FaStar style={{ color: "#FFD700", fontSize: "16px" }} />
              <span style={{ fontSize: "10px", opacity: 0.8 }}>
                {achievement.global_percent.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </ButtonItem>
    </PanelSectionRow>
  );

  // Render content based on current tab
  const renderContent = () => {
    switch (currentTab) {
      case Tab.CURRENT_GAME:
        return (
          <>
            {/* Current Game Info */}
            <PanelSection title="Current Game">
              {currentGame ? (
                <>
                  <PanelSectionRow>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaGamepad />
                      <span style={{ fontWeight: "bold" }}>{currentGame.name}</span>
                    </div>
                  </PanelSectionRow>
                  
                  {currentGame.has_achievements && (
                    <PanelSectionRow>
                      <span style={{ fontSize: "12px", opacity: 0.8 }}>
                        {currentGame.achievement_count} achievements available
                      </span>
                    </PanelSectionRow>
                  )}
                </>
              ) : (
                <PanelSectionRow>
                  <div style={{ opacity: 0.6 }}>No game currently running</div>
                </PanelSectionRow>
              )}
            </PanelSection>

            {/* Achievement Progress */}
            {achievements && !achievements.error && (
              <PanelSection title="Achievement Progress">
                <PanelSectionRow>
                  <ProgressBarWithInfo
                    nProgress={achievements.total > 0 ? achievements.unlocked / achievements.total : 0}
                    sOperationText={`${achievements.unlocked} / ${achievements.total} achievements`}
                    nTransitionSec={0.3}
                  />
                </PanelSectionRow>
                
                <PanelSectionRow>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>
                      <FaTrophy style={{ marginRight: "4px", color: "#FFD700" }} />
                      {achievements.unlocked} / {achievements.total} unlocked
                    </span>
                    <span>{achievements.percentage}% complete</span>
                  </div>
                  <ProgressBar 
                    nProgress={achievements.percentage / 100}
                    nTransitionSec={0.3}
                  />
                </PanelSectionRow>
              </PanelSection>
            )}

            {/* Filters and Sort */}
            <PanelSection title="Filters">
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={() => {
                    showContextMenu(
                      <Menu label="Sort By">
                        <MenuItem onClick={() => setSortBy("unlock")}>
                          Recently Unlocked
                        </MenuItem>
                        <MenuItem onClick={() => setSortBy("name")}>
                          Name
                        </MenuItem>
                        <MenuItem onClick={() => setSortBy("rarity")}>
                          Rarity
                        </MenuItem>
                      </Menu>
                    );
                  }}
                >
                  Sort: {sortBy === "unlock" ? "Recently Unlocked" : sortBy === "name" ? "Name" : "Rarity"}
                </ButtonItem>
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ToggleField
                  label="Show hidden achievements"
                  checked={showHidden}
                  onChange={setShowHidden}
                />
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={() => {
                    showContextMenu(
                      <Menu label="Filter by Rarity">
                        <MenuItem onClick={() => setFilterRarity(0)}>
                          All achievements
                        </MenuItem>
                        <MenuItem onClick={() => setFilterRarity(50)}>
                          Uncommon (&lt;50%)
                        </MenuItem>
                        <MenuItem onClick={() => setFilterRarity(25)}>
                          Rare (&lt;25%)
                        </MenuItem>
                        <MenuItem onClick={() => setFilterRarity(10)}>
                          Very Rare (&lt;10%)
                        </MenuItem>
                        <MenuItem onClick={() => setFilterRarity(5)}>
                          Ultra Rare (&lt;5%)
                        </MenuItem>
                      </Menu>
                    );
                  }}
                >
                  Rarity: {filterRarity === 0 ? "All" : `<${filterRarity}%`}
                </ButtonItem>
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaSync className={isLoading ? "spinning" : ""} />
                    Refresh
                  </div>
                </ButtonItem>
              </PanelSectionRow>
            </PanelSection>

            {/* Achievement List */}
            {achievements && !achievements.error && (
              <PanelSection title="Achievements">
                <Focusable style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {getSortedAchievements().map((achievement) => (
                    <AchievementItem 
                      key={achievement.api_name} 
                      achievement={achievement} 
                    />
                  ))}
                </Focusable>
              </PanelSection>
            )}
            
            {achievements?.error && (
              <PanelSection>
                <PanelSectionRow>
                  <div style={{ color: "#ff6b6b" }}>
                    Error: {achievements.error}
                  </div>
                </PanelSectionRow>
              </PanelSection>
            )}
          </>
        );

      case Tab.RECENT:
        return (
          <>
            <PanelSection title="Recent Achievements">
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={fetchRecentAchievements}
                  disabled={isLoading}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaSync className={isLoading ? "spinning" : ""} />
                    Refresh Recent
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              
              <Focusable style={{ maxHeight: "500px", overflowY: "auto" }}>
                {recentAchievements.map((ach, index) => (
                  <PanelSectionRow key={`${ach.game_id}_${ach.unlock_time}_${index}`}>
                    <ButtonItem
                      layout="below"
                      onClick={() => {
                        Navigation.NavigateToExternalWeb(`steam://nav/games/details/${ach.game_id}`);
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {ach.icon && (
                          <img 
                            src={ach.icon} 
                            style={{ width: "32px", height: "32px", borderRadius: "4px" }}
                            alt=""
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                            {ach.achievement_name}
                          </div>
                          <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            {ach.game_name}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.6 }}>
                            {formatTime(ach.unlock_time)}
                          </div>
                        </div>
                        {ach.global_percent <= 10 && (
                          <div style={{ textAlign: "center" }}>
                            <FaStar style={{ color: "#FFD700" }} />
                            <div style={{ fontSize: "10px" }}>
                              {ach.global_percent.toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </ButtonItem>
                  </PanelSectionRow>
                ))}
              </Focusable>
            </PanelSection>
          </>
        );

      case Tab.OVERALL:
        return (
          <>
            <PanelSection title="Overall Progress">
              {overallProgress && !overallProgress.error ? (
                <>
                  <PanelSectionRow>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total Games</span>
                      <span style={{ fontWeight: "bold" }}>{overallProgress.total_games}</span>
                    </div>
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Games with Achievements</span>
                      <span style={{ fontWeight: "bold" }}>{overallProgress.games_with_achievements}</span>
                    </div>
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <ProgressBarWithInfo
                      nProgress={overallProgress.total_achievements > 0 ? overallProgress.unlocked_achievements / overallProgress.total_achievements : 0}
                      sOperationText={`${overallProgress.unlocked_achievements} / ${overallProgress.total_achievements} total achievements`}
                      nTransitionSec={0.3}
                    />
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Average Completion</span>
                      <span style={{ fontWeight: "bold" }}>{overallProgress.average_completion}%</span>
                    </div>
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Perfect Games</span>
                      <span style={{ fontWeight: "bold" }}>{overallProgress.perfect_games_count}</span>
                    </div>
                  </PanelSectionRow>
                </>
              ) : (
                <PanelSectionRow>
                  <div style={{ opacity: 0.6 }}>
                    {overallProgress?.error || "Loading overall progress..."}
                  </div>
                </PanelSectionRow>
              )}
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={fetchOverallProgress}
                  disabled={isLoading}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaSync className={isLoading ? "spinning" : ""} />
                    Calculate Progress
                  </div>
                </ButtonItem>
              </PanelSectionRow>
            </PanelSection>
            
            {overallProgress?.perfect_games && overallProgress.perfect_games.length > 0 && (
              <PanelSection title="Perfect Games">
                <Focusable style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {overallProgress.perfect_games.map((game) => (
                    <PanelSectionRow key={game.app_id}>
                      <ButtonItem
                        layout="below"
                        onClick={() => {
                          Navigation.NavigateToExternalWeb(`steam://nav/games/details/${game.app_id}`);
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FaTrophy style={{ color: "#FFD700" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold" }}>{game.name}</div>
                            <div style={{ fontSize: "12px", opacity: 0.7 }}>
                              {game.achievements} achievements
                            </div>
                          </div>
                          <span style={{ color: "#4CAF50", fontWeight: "bold" }}>100%</span>
                        </div>
                      </ButtonItem>
                    </PanelSectionRow>
                  ))}
                </Focusable>
              </PanelSection>
            )}
          </>
        );

      case Tab.SETTINGS:
        return (
          <>
            <PanelSection title="Steam API Configuration">
              <PanelSectionRow>
                <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "8px" }}>
                  Get your API key from: steamcommunity.com/dev/apikey
                </div>
              </PanelSectionRow>
              
              <PanelSectionRow>
                <TextField
                  label="Steam API Key"
                  value={steamApiKey}
                  onChange={(e: any) => setSteamApiKeyState(e.target.value)}
                  bIsPassword={true}
                />
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={saveApiKey}
                  disabled={!steamApiKey}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaKey />
                    Save API Key
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              
              {apiKeySet && (
                <PanelSectionRow>
                  <div style={{ color: "#4CAF50", fontSize: "12px" }}>
                    ✓ API Key is configured
                  </div>
                </PanelSectionRow>
              )}
            </PanelSection>
            
            <PanelSection title="Auto Refresh">
              <PanelSectionRow>
                <ToggleField
                  label="Enable auto-refresh"
                  description="Automatically update achievements"
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                />
              </PanelSectionRow>
              
              {autoRefresh && (
                <PanelSectionRow>
                  <ButtonItem
                    layout="below"
                    onClick={() => {
                      showContextMenu(
                        <Menu label="Refresh Interval">
                          <MenuItem onClick={() => setRefreshInterval(15)}>15 seconds</MenuItem>
                          <MenuItem onClick={() => setRefreshInterval(30)}>30 seconds</MenuItem>
                          <MenuItem onClick={() => setRefreshInterval(60)}>1 minute</MenuItem>
                          <MenuItem onClick={() => setRefreshInterval(300)}>5 minutes</MenuItem>
                        </Menu>
                      );
                    }}
                  >
                    Refresh every: {refreshInterval < 60 ? `${refreshInterval} seconds` : `${refreshInterval / 60} minutes`}
                  </ButtonItem>
                </PanelSectionRow>
              )}
            </PanelSection>
            
            <PanelSection title="Cache">
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={async () => {
                    await refreshCache();
                    toaster.toast({
                      title: "Cache Cleared",
                      body: "Achievement cache has been cleared successfully!"
                    });
                  }}
                >
                  Clear All Cache
                </ButtonItem>
              </PanelSectionRow>
            </PanelSection>
          </>
        );
    }
  };

  return (
    <>
      {/* Tab Navigation */}
      <PanelSection>
        <Focusable style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
          <DialogButton
            style={{ flex: 1 }}
            onClick={() => setCurrentTab(Tab.CURRENT_GAME)}
            className={currentTab === Tab.CURRENT_GAME ? "gpfocus" : ""}
          >
            <FaGamepad />
          </DialogButton>
          <DialogButton
            style={{ flex: 1 }}
            onClick={() => setCurrentTab(Tab.RECENT)}
            className={currentTab === Tab.RECENT ? "gpfocus" : ""}
          >
            <FaClock />
          </DialogButton>
          <DialogButton
            style={{ flex: 1 }}
            onClick={() => setCurrentTab(Tab.OVERALL)}
            className={currentTab === Tab.OVERALL ? "gpfocus" : ""}
          >
            <FaChartLine />
          </DialogButton>
          <DialogButton
            style={{ flex: 1 }}
            onClick={() => setCurrentTab(Tab.SETTINGS)}
            className={currentTab === Tab.SETTINGS ? "gpfocus" : ""}
          >
            Settings
          </DialogButton>
        </Focusable>
      </PanelSection>
      
      {/* Tab Content */}
      {renderContent()}
    </>
  );
}

// CSS for animations
const styles = `
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .gpfocus {
    background: rgba(255, 255, 255, 0.1);
  }
`;

// Plugin definition
export default definePlugin(() => {
  console.log("Steam Achievement Tracker initializing");
  
  // Inject styles
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  // Listen for achievement unlock events (future feature)
  const achievementListener = addEventListener<[
    game_name: string,
    achievement_name: string,
    rarity: number
  ]>("achievement_unlocked", (game_name, achievement_name, rarity) => {
    console.log("Achievement unlocked:", game_name, achievement_name, rarity);
    toaster.toast({
      title: "Achievement Unlocked!",
      body: `${achievement_name} in ${game_name}${rarity < 10 ? " (Rare!)" : ""}`
    });
  });

  return {
    // The name shown in various decky menus
    name: "Steam Achievement Tracker",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>Achievement Tracker</div>,
    // The content of your plugin's menu
    content: <Content />,
    // The icon displayed in the plugin list
    icon: <FaTrophy />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log("Steam Achievement Tracker unloading");
      removeEventListener("achievement_unlocked", achievementListener);
      styleElement.remove();
    },
  };
});