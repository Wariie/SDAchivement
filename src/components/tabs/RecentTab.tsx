// components/tabs/RecentTab.tsx
import { VFC, useState } from "react";
import { 
  PanelSection, 
  PanelSectionRow, 
  ButtonItem, 
  DialogButton,
  Focusable,
  Navigation
} from "@decky/ui";
import { FaList, FaEye, FaSync, FaStar } from "react-icons/fa";
import { 
  RecentSubTab, 
  RecentAchievement, 
  TrackedGame, 
  AchievementData 
} from "../../models";
import { formatTime, formatGlobalPercent } from "../../services/formatters";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface RecentTabProps {
  recentAchievements: RecentAchievement[];
  trackedGame: TrackedGame | null;
  trackedGameAchievements: AchievementData | null;
  isLoading: boolean;
  onFetchRecent: () => Promise<void>;
  onSetTrackedGame: (game: TrackedGame) => void;
  onClearTrackedGame: () => void;
  onFetchTrackedAchievements: () => Promise<void>;
}

export const RecentTab: VFC<RecentTabProps> = ({
  recentAchievements,
  trackedGame,
  trackedGameAchievements,
  isLoading,
  onFetchRecent,
  onSetTrackedGame,
  onClearTrackedGame,
  onFetchTrackedAchievements
}) => {
  const [recentSubTab, setRecentSubTab] = useState<RecentSubTab>(RecentSubTab.ALL);

  const handleNavigateToGame = (gameId: number) => {
    Navigation.NavigateToSteamWeb(`https://store.steampowered.com/app/${gameId}`);
  };

  return (
    <div style={{ padding: "0", margin: "0" }}>
      {/* Sub-tab navigation */}
      <PanelSection>
        <Focusable style={{ display: "flex", gap: "4px" }}>
          <DialogButton
            style={{ 
              flex: 1,
              minWidth: "60px",
              fontSize: "12px",
              padding: "8px",
              backgroundColor: recentSubTab === RecentSubTab.ALL ? "rgba(255,255,255,0.15)" : "transparent"
            }}
            onClick={() => setRecentSubTab(RecentSubTab.ALL)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <FaList size={12} />
              <span>Recent</span>
            </div>
          </DialogButton>
          <DialogButton
            style={{ 
              flex: 1,
              minWidth: "60px",
              fontSize: "12px",
              padding: "8px",
              backgroundColor: recentSubTab === RecentSubTab.TRACKED ? "rgba(255,255,255,0.15)" : "transparent"
            }}
            onClick={() => setRecentSubTab(RecentSubTab.TRACKED)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <FaEye size={12} />
              <span>Tracked</span>
            </div>
          </DialogButton>
        </Focusable>
      </PanelSection>

      {recentSubTab === RecentSubTab.ALL ? (
        <PanelSection title="Recent Achievements">
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={onFetchRecent}
              disabled={isLoading}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <FaSync 
                  style={{ 
                    fontSize: "12px",
                    animation: isLoading ? "spin 1s linear infinite" : "none"
                  }} 
                />
                Refresh Recent
              </div>
            </ButtonItem>
          </PanelSectionRow>
          
          {recentAchievements.length > 0 ? (
            <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
              <Focusable style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {recentAchievements.map((ach, index) => (
                  <PanelSectionRow key={`${ach.game_id}_${ach.unlock_time}_${index}`}>
                    <ButtonItem
                      layout="below"
                      onClick={() => handleNavigateToGame(ach.game_id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
                        {ach.icon && (
                          <img 
                            src={ach.icon} 
                            style={{ width: "28px", height: "28px", borderRadius: "4px" }}
                            alt=""
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "2px" }}>
                            {ach.achievement_name}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "1px" }}>
                            {ach.game_name}
                          </div>
                          <div style={{ fontSize: "10px", opacity: 0.6 }}>
                            {formatTime(ach.unlock_time)}
                          </div>
                        </div>
                        {ach.global_percent !== null && !isNaN(ach.global_percent) && ach.global_percent <= 10 && (
                          <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            alignItems: "center",
                            minWidth: "35px"
                          }}>
                            <FaStar style={{ color: "#FFD700", fontSize: "14px" }} />
                            <div style={{ fontSize: "9px", opacity: 0.8 }}>
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
              <div style={{ opacity: 0.6, textAlign: "center", padding: "15px", fontSize: "14px" }}>
                {isLoading ? (
                  <LoadingSpinner message="Loading recent achievements..." size="small" />
                ) : (
                  "No recent achievements found"
                )}
              </div>
            </PanelSectionRow>
          )}
        </PanelSection>
      ) : (
        <PanelSection title="Tracked Game">
          {!trackedGame ? (
            <>
              <PanelSectionRow>
                <div style={{ textAlign: "center", opacity: 0.6, padding: "20px", fontSize: "14px" }}>
                  No game selected for tracking
                </div>
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={() => {
                    // This would need to show a game selection modal
                    // For now, just show a placeholder
                    alert("Game selection modal would open here");
                  }}
                >
                  <div style={{ fontSize: "14px" }}>
                    Select Game to Track
                  </div>
                </ButtonItem>
              </PanelSectionRow>
            </>
          ) : (
            <>
              <PanelSectionRow>
                <div style={{ 
                  padding: "10px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: "4px"
                }}>
                  <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "14px" }}>
                    {trackedGame.name}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>
                    App ID: {trackedGame.app_id}
                  </div>
                </div>
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={onClearTrackedGame}
                >
                  <div style={{ fontSize: "14px" }}>
                    Clear Tracked Game
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={onFetchTrackedAchievements}
                  disabled={isLoading}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                    <FaSync 
                      style={{ 
                        fontSize: "12px",
                        animation: isLoading ? "spin 1s linear infinite" : "none"
                      }} 
                    />
                    Refresh Achievements
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              
              {trackedGameAchievements && !trackedGameAchievements.error && (
                <>
                  <PanelSectionRow>
                    <div style={{ fontSize: "12px", marginBottom: "4px", padding: "8px" }}>
                      Progress: {trackedGameAchievements.unlocked} / {trackedGameAchievements.total} 
                      ({Math.round(trackedGameAchievements.unlocked / trackedGameAchievements.total * 100)}%)
                    </div>
                  </PanelSectionRow>
                  
                  <div style={{ maxHeight: "250px", overflowY: "auto", marginTop: "10px" }}>
                    <Focusable style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {trackedGameAchievements.achievements
                        .filter(a => a.unlocked)
                        .slice(0, 10)
                        .map((achievement) => (
                          <PanelSectionRow key={achievement.api_name}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                              {achievement.icon && (
                                <img 
                                  src={achievement.icon} 
                                  style={{ width: "24px", height: "24px", borderRadius: "3px" }}
                                  alt=""
                                />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "1px" }}>
                                  {achievement.display_name}
                                </div>
                                <div style={{ fontSize: "10px", opacity: 0.7 }}>
                                  {achievement.description}
                                </div>
                              </div>
                            </div>
                          </PanelSectionRow>
                        ))}
                    </Focusable>
                  </div>
                </>
              )}
            </>
          )}
        </PanelSection>
      )}
    </div>
  );
};