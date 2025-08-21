import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Navigation,
  staticClasses,
  DialogButton,
  ProgressBarWithInfo,
  ToggleField,
  TextField,
  Focusable,
  Menu,
  MenuItem,
  showContextMenu
} from "@decky/ui";
import {
  callable,
  definePlugin,
  toaster
} from "@decky/api";
import { useState, useEffect, useCallback } from "react";
import { FaTrophy, FaGamepad, FaClock, FaStar, FaSync, FaKey, FaCheck, FaLock, FaPercent, FaChartLine, FaUser } from "react-icons/fa";

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
  header_image?: string;
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
const setTestGame = callable<[app_id: number], boolean>("set_test_game");
const loadSettings = callable<[], any>("load_settings");
const refreshCache = callable<[app_id?: number], boolean>("refresh_cache");
const clearTestGame = callable<[], boolean>("clear_test_game");

function formatGlobalPercent(percent: any): string {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return "N/A";
  }
  return `${Number(percent).toFixed(1)}%`;
}

function calculateProgress(unlocked: any, total: any) {
  const unlockedNum = Number(unlocked) || 0;
  const totalNum = Number(total) || 0;
  
  if (totalNum === 0) {
    return 0;
  }
  
  const progress = unlockedNum / totalNum;
  return Math.max(0, Math.min(1, progress));
}

function formatProgressText(unlocked: any, total: any, showPercentage = false) {
  const unlockedNum = Number(unlocked) || 0;
  const totalNum = Number(total) || 0;
  
  if (showPercentage) {
    const percentage = totalNum > 0 ? Math.round((unlockedNum / totalNum) * 100) : 0;
    return `${unlockedNum} / ${totalNum} achievements (${percentage}%)`;
  }
  
  return `${unlockedNum} / ${totalNum} achievements`;
}

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
  const [testGameId, setTestGameId] = useState("");
  const [steamUserId, setSteamUserIdState] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

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
    }
    return null;
  }, []);

  // Fetch achievements for a game
  const fetchAchievements = useCallback(async (appId?: number) => {
    setIsLoading(true);
    setLoadingMessage("Loading achievements...");
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
        setAchievements(null);
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to fetch achievements",
        critical: true
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
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
    setIsLoading(true);
    setLoadingMessage("Loading recent achievements...");
    try {
      const result = await getRecentAchievements(20);
      if (result) {
        setRecentAchievements(result);
      }
    } catch (error) {
      console.error("Failed to fetch recent achievements:", error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  // Fetch overall progress
  const fetchOverallProgress = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage("Calculating overall progress...");
    try {
      const result = await getAchievementProgress();
      if (result && !result.error) {
        setOverallProgress(result);
      }
    } catch (error) {
      console.error("Failed to fetch overall progress:", error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  // Load settings
  const loadPluginSettings = useCallback(async () => {
    try {
      const result = await loadSettings();
      if (result) {
        setApiKeySet(!!result.steam_api_key);
        setSteamUserIdState(result.steam_user_id || "");
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
      const success = await setSteamApiKey(steamApiKey);
      if (success) {
        setApiKeySet(true);
        toaster.toast({
          title: "Success",
          body: "Steam API key saved successfully!"
        });
        await handleFullRefresh();
      } else {
        toaster.toast({
          title: "Error",
          body: "Failed to save API key",
          critical: true
        });
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to save API key",
        critical: true
      });
    }
  }, [steamApiKey]);

  // Set test game
  const handleSetTestGame = useCallback(async () => {
    try {
      const appId = parseInt(testGameId);
      if (isNaN(appId)) {
        toaster.toast({
          title: "Invalid ID",
          body: "Please enter a valid number",
          critical: true
        });
        return;
      }
      
      const success = await setTestGame(appId);
      if (success) {
        await handleFullRefresh();
        toaster.toast({
          title: "Test Game Set",
          body: `Testing with App ID: ${appId}`
        });
      }
    } catch (error) {
      console.error("Failed to set test game:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to set test game",
        critical: true
      });
    }
  }, [testGameId]);

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
  }, [currentGame, fetchAchievements, fetchGameStats]);

  // Full data refresh
  const handleFullRefresh = useCallback(async () => {
    const game = await fetchCurrentGame();
    if (game) {
      await fetchAchievements(game.app_id);
      await fetchGameStats(game.app_id);
    }
    if (currentTab === Tab.RECENT) {
      await fetchRecentAchievements();
    }
    if (currentTab === Tab.OVERALL) {
      await fetchOverallProgress();
    }
  }, [currentTab, fetchCurrentGame, fetchAchievements, fetchGameStats, fetchRecentAchievements, fetchOverallProgress]);

  // Initial load
  useEffect(() => {
    loadPluginSettings();
    handleFullRefresh();
  }, []);

  // Tab change handler
  useEffect(() => {
    if (currentTab === Tab.RECENT && recentAchievements.length === 0) {
      fetchRecentAchievements();
    } else if (currentTab === Tab.OVERALL && !overallProgress) {
      fetchOverallProgress();
    }
  }, [currentTab]);

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
  }, [autoRefresh, refreshInterval, currentTab, fetchCurrentGame, fetchAchievements]);

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
        filtered = filtered.filter(a => 
            a.global_percent !== null && 
            !isNaN(a.global_percent) && 
            a.global_percent <= filterRarity
        );
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
            const aPercent = (a.global_percent !== null && !isNaN(a.global_percent)) ? a.global_percent : 100;
            const bPercent = (b.global_percent !== null && !isNaN(b.global_percent)) ? b.global_percent : 100;
            return aPercent - bPercent;
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
              {achievement.global_percent !== null && !isNaN(achievement.global_percent) && (
                <MenuItem>
                    <FaPercent /> {formatGlobalPercent(achievement.global_percent)} of players
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
                {formatGlobalPercent(achievement.global_percent)}
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
            {/* Game Banner */}
            {currentGame ? (
              <>
                <div style={{
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginBottom: "12px",
                  minHeight: "80px",
                  background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
                }}>
                  {/* Background Image */}
                  {currentGame.header_image && (
                    <img 
                      src={currentGame.header_image}
                      style={{
                        width: "100%",
                        height: "80px",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        opacity: 0.8
                      }}
                      alt=""
                    />
                  )}
                  
                  {/* Overlay */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)"
                  }} />
                  
                  {/* Content */}
                  <div style={{
                    position: "relative",
                    padding: "12px 16px",
                    height: "80px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    color: "white"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px"
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "bold",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                        flex: 1
                      }}>
                        {currentGame.name.replace("[TEST] ", "")}
                      </h3>
                      
                      {/* Test mode indicator */}
                      {currentGame.name.startsWith("[TEST]") && (
                        <span style={{ 
                          backgroundColor: "#ff6b6b", 
                          color: "white", 
                          padding: "2px 8px", 
                          borderRadius: "12px", 
                          fontSize: "10px",
                          fontWeight: "bold",
                          textShadow: "none"
                        }}>
                          TEST
                        </span>
                      )}
                    </div>
                    
                    {currentGame.has_achievements && (
                      <div style={{
                        fontSize: "12px",
                        opacity: 0.9,
                        textShadow: "1px 1px 1px rgba(0,0,0,0.5)"
                      }}>
                        {currentGame.achievement_count} achievements available
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      padding: "6px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.5 : 1,
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onClick={isLoading ? undefined : async () => {
                      const refreshedGame = await fetchCurrentGame();
                      if (refreshedGame) {
                        await fetchAchievements(refreshedGame.app_id);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                      }
                    }}
                  >
                    <FaSync 
                      style={{ 
                        fontSize: "12px", 
                        color: "white" 
                      }} 
                      className={isLoading ? "spinning" : ""} 
                    />
                  </div>
                </div>
                
                {/* Test mode warning */}
                {currentGame.name.startsWith("[TEST]") && (
                  <PanelSection>
                    <PanelSectionRow>
                      <div style={{ 
                        backgroundColor: "rgba(255, 107, 107, 0.1)", 
                        border: "1px solid rgba(255, 107, 107, 0.3)",
                        borderRadius: "4px",
                        padding: "8px",
                        fontSize: "11px",
                        textAlign: "center"
                      }}>
                        ⚠️ Test mode active - Go to Settings to clear test game
                      </div>
                    </PanelSectionRow>
                  </PanelSection>
                )}
              </>
            ) : (
              <PanelSection>
                <PanelSectionRow>
                  <div style={{ 
                    textAlign: "center", 
                    padding: "20px",
                    opacity: 0.6 
                  }}>
                    <FaGamepad style={{ fontSize: "32px", marginBottom: "8px" }} />
                    <div>No game currently running</div>
                    {!apiKeySet && <div style={{ fontSize: "12px" }}>API key needed</div>}
                  </div>
                </PanelSectionRow>
                <PanelSectionRow>
                  <ButtonItem
                    layout="below"
                    onClick={fetchCurrentGame}
                    disabled={isLoading}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaSync className={isLoading ? "spinning" : ""} />
                      Check for Game
                    </div>
                  </ButtonItem>
                </PanelSectionRow>
              </PanelSection>
            )}

            {/* Achievement Progress */}
            {achievements && !achievements.error && (
              <PanelSection title="Progress">
                <PanelSectionRow>
                  <ProgressBarWithInfo
                    nProgress={calculateProgress(achievements.unlocked, achievements.total)}
                    sOperationText={formatProgressText(achievements.unlocked, achievements.total)}
                    nTransitionSec={0.3}
                  />
                </PanelSectionRow>
                
                <PanelSectionRow>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    fontSize: "12px"
                  }}>
                    <span>{Math.round(calculateProgress(achievements.unlocked, achievements.total) * 100)}% complete</span>
                    <span>{(Number(achievements.total) || 0) - (Number(achievements.unlocked) || 0)} remaining</span>
                  </div>
                </PanelSectionRow>
              </PanelSection>
            )}

            {/* Filters and Sort */}
            {achievements && !achievements.error && achievements.total > 0 && (
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
            )}

            {/* Achievement List */}
            {achievements && !achievements.error && achievements.total > 0 && (
              <PanelSection title="Achievements">
                <div 
                  className="achievement-scroll-container"
                  style={{ 
                    maxHeight: "400px", 
                    overflowY: "auto",
                    overflowX: "hidden",
                    height: "auto"
                  }}
                >
                  <Focusable className="no-gap-list">
                    {getSortedAchievements().map((achievement) => (
                      <AchievementItem 
                        key={achievement.api_name} 
                        achievement={achievement} 
                      />
                    ))}
                  </Focusable>
                </div>
              </PanelSection>
            )}
            
            {/* Error message */}
            {achievements?.error && (
              <PanelSection>
                <PanelSectionRow>
                  <div style={{ color: "#ff6b6b" }}>
                    {achievements.error}
                  </div>
                </PanelSectionRow>
              </PanelSection>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <PanelSection>
                <PanelSectionRow>
                  <div style={{ textAlign: "center", opacity: 0.6 }}>
                    {loadingMessage || "Loading..."}
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
              
              {recentAchievements.length > 0 ? (
                <div style={{ 
                  maxHeight: "500px", 
                  overflowY: "auto",
                  overflowX: "hidden"
                }}>
                  <Focusable className="no-gap-list">
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
                            {ach.global_percent !== null && !isNaN(ach.global_percent) && ach.global_percent <= 10 && (
                              <div style={{ textAlign: "center" }}>
                                <FaStar style={{ color: "#FFD700" }} />
                                <div style={{ fontSize: "10px" }}>
                                  {formatGlobalPercent(ach.global_percent)}
                                </div>
                              </div>
                            )}
                          </div>
                        </ButtonItem>
                      </PanelSectionRow>
                    ))}
                  </Focusable>
                </div>
              ) : (
                <PanelSectionRow>
                  <div style={{ opacity: 0.6, textAlign: "center" }}>
                    {isLoading ? "Loading recent achievements..." : "No recent achievements found"}
                  </div>
                </PanelSectionRow>
              )}
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
                      <span style={{ fontWeight: "bold" }}>{overallProgress.total_games || 0}</span>
                    </div>
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Games with Achievements</span>
                      <span style={{ fontWeight: "bold" }}>{overallProgress.games_with_achievements || 0}</span>
                    </div>
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <ProgressBarWithInfo
                      nProgress={calculateProgress(overallProgress.unlocked_achievements, overallProgress.total_achievements)}
                      sOperationText={formatProgressText(overallProgress.unlocked_achievements, overallProgress.total_achievements, true)}
                      nTransitionSec={0.3}
                    />
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Average Completion</span>
                      <span style={{ fontWeight: "bold" }}>{Number(overallProgress.average_completion) || 0}%</span>
                    </div>
                  </PanelSectionRow>
                  
                  <PanelSectionRow>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Perfect Games</span>
                      <span style={{ fontWeight: "bold" }}>{overallProgress.perfect_games_count || 0}</span>
                    </div>
                  </PanelSectionRow>
                </>
              ) : (
                <PanelSectionRow>
                  <div style={{ opacity: 0.6 }}>
                    {isLoading ? "Calculating overall progress..." : "Click below to calculate progress"}
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
                <div style={{ 
                  maxHeight: "300px", 
                  overflowY: "auto",
                  overflowX: "hidden"
                }}>
                  <Focusable className="no-gap-list">
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
                </div>
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
              
              {apiKeySet ? (
                <PanelSectionRow>
                  <div style={{ color: "#4CAF50", fontSize: "12px" }}>
                    ✓ API Key is configured
                  </div>
                </PanelSectionRow>
              ) : (
                <PanelSectionRow>
                  <div style={{ color: "#ff6b6b", fontSize: "12px" }}>
                    ✗ No API Key configured
                  </div>
                </PanelSectionRow>
              )}
            </PanelSection>
            
            {/* Steam User ID - Just display, don't allow editing */}
            <PanelSection title="Steam User">
              <PanelSectionRow>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Steam User ID:</span>
                  <span style={{ 
                    fontFamily: "monospace", 
                    fontSize: "12px",
                    opacity: steamUserId ? 1 : 0.5
                  }}>
                    {steamUserId || "Not detected"}
                  </span>
                </div>
              </PanelSectionRow>
              
              {steamUserId && (
                <PanelSectionRow>
                  <div style={{ fontSize: "11px", opacity: 0.6 }}>
                    Automatically detected from Steam installation
                  </div>
                </PanelSectionRow>
              )}
            </PanelSection>

            {/* Testing Section - Keep for debugging */}
            <PanelSection title="Testing">
              <PanelSectionRow>
                <TextField
                  label="Test Game ID"
                  value={testGameId}
                  onChange={(e: any) => setTestGameId(e.target.value)}
                  description="Steam App ID (e.g., 730 for CS:GO)"
                />
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={handleSetTestGame}
                  disabled={!testGameId}
                >
                  Set Test Game
                </ButtonItem>
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={async () => {
                    try {
                      const success = await clearTestGame();
                      if (success) {
                        toaster.toast({
                          title: "Test Game Cleared",
                          body: "Now detecting games normally"
                        });
                        setTestGameId("");
                        await handleFullRefresh();
                      } else {
                        toaster.toast({
                          title: "Error",
                          body: "Failed to clear test game",
                          critical: true
                        });
                      }
                    } catch (error) {
                      console.error("Failed to clear test game:", error);
                      toaster.toast({
                        title: "Error",
                        body: "Failed to clear test game",
                        critical: true
                      });
                    }
                  }}
                >
                  Clear Test Game
                </ButtonItem>
              </PanelSectionRow>
              
              <PanelSectionRow>
                <div style={{ fontSize: "11px", opacity: 0.6 }}>
                  Examples: 730 (CS:GO), 570 (Dota 2), 440 (TF2)
                </div>
              </PanelSectionRow>
            </PanelSection>
            
            <PanelSection title="Auto Refresh">
              <PanelSectionRow>
                <ToggleField
                  label="Enable auto-refresh"
                  description="Update achievements automatically"
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
                    Interval: {refreshInterval < 60 ? `${refreshInterval} seconds` : `${refreshInterval / 60} minutes`}
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
                      body: "Achievement cache has been cleared!"
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
        <Focusable style={{ display: "flex", gap: "2px" }}>
          <DialogButton
            style={{ 
              flex: 1, 
              padding: "8px",
              minWidth: "40px",
              backgroundColor: currentTab === Tab.CURRENT_GAME ? "rgba(255,255,255,0.1)" : "transparent"
            }}
            onClick={() => setCurrentTab(Tab.CURRENT_GAME)}
          >
            <FaGamepad size={16} />
          </DialogButton>
          <DialogButton
            style={{ 
              flex: 1, 
              padding: "8px",
              minWidth: "40px",
              backgroundColor: currentTab === Tab.RECENT ? "rgba(255,255,255,0.1)" : "transparent"
            }}
            onClick={() => setCurrentTab(Tab.RECENT)}
          >
            <FaClock size={16} />
          </DialogButton>
          <DialogButton
            style={{ 
              flex: 1, 
              padding: "8px",
              minWidth: "40px",
              backgroundColor: currentTab === Tab.OVERALL ? "rgba(255,255,255,0.1)" : "transparent"
            }}
            onClick={() => setCurrentTab(Tab.OVERALL)}
          >
            <FaChartLine size={16} />
          </DialogButton>
          <DialogButton
            style={{ 
              flex: 1, 
              padding: "8px",
              minWidth: "40px",
              backgroundColor: currentTab === Tab.SETTINGS ? "rgba(255,255,255,0.1)" : "transparent"
            }}
            onClick={() => setCurrentTab(Tab.SETTINGS)}
          >
            <FaKey size={16} />
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

  /* Fix scrolling gaps and improve scroll behavior */
  .achievement-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }
  
  .achievement-scroll-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .achievement-scroll-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .achievement-scroll-container::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  .achievement-scroll-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  /* Remove gaps in lists */
  .no-gap-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .no-gap-list > * {
    margin: 0 !important;
    padding-bottom: 0 !important;
  }
`;

// Plugin definition
export default definePlugin(() => {
  console.log("SDAchievement initializing");
  
  // Inject styles
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  return {
    name: "SDAchievement",
    titleView: <div className={staticClasses.Title}>SDAchievement</div>,
    content: <Content />,
    icon: <FaTrophy />,
    onDismount() {
      console.log("SDAchievement unloading");
      styleElement.remove();
    },
  };
});