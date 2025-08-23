// components/tabs/OverallTab.tsx
import { VFC } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, Focusable, showModal, ConfirmModal } from "@decky/ui";
import { FaChartLine, FaSync, FaTrophy } from "react-icons/fa";
import { OverallProgress, GameInfo } from "../../models";
import { ProgressDisplay } from "../common/ProgressDisplay";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { getMilestoneInfo } from "../../services/formatters";
import { useGameArtwork } from "../../hooks/useGameArtwork";

interface OverallTabProps {
  overallProgress: OverallProgress | null;
  isLoading: boolean;
  onFetchProgress: () => Promise<void>;
  onGameClick?: (gameId: number) => void;
}

// Enhanced Perfect Game Modal Component
const PerfectGameModal: VFC<{ game: GameInfo; closeModal?: () => void }> = ({ game, closeModal }) => {
  const { getBestImage } = useGameArtwork(game.app_id);
  
  const formatPlaytime = (minutes?: number): string => {
    if (!minutes || minutes === 0) return "Not tracked";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60 * 10) / 10;
    return `${hours}h`;
  };

  return (
    <ConfirmModal
      strTitle=""
      onOK={closeModal}
      onCancel={closeModal}
      strOKButtonText="Close"
      bHideCloseIcon={false}
    >
      <div style={{ padding: "0" }}>
        {/* Hero Image Banner */}
        <div style={{
          position: "relative",
          height: "120px",
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          borderRadius: "8px 8px 0 0",
          overflow: "hidden",
          marginBottom: "15px"
        }}>
          {getBestImage(game.header_image) && (
            <img 
              src={getBestImage(game.header_image)!}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.8
              }}
              alt=""
            />
          )}
          
          {/* Overlay with gradient */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)"
          }} />
          
          {/* Title and Perfect Badge */}
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: "15px",
            right: "15px",
            color: "white"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px"
            }}>
              <h3 style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "bold",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {game.name}
              </h3>
              <span style={{
                backgroundColor: "#FFD700",
                color: "#000",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "bold",
                marginLeft: "8px"
              }}>
                💯 PERFECT
              </span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div style={{ padding: "0 15px 15px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "15px"
          }}>
            <div style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              padding: "12px",
              borderRadius: "6px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4CAF50" }}>
                {game.achievements}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.7 }}>
                Achievements
              </div>
            </div>
            
            <div style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              padding: "12px",
              borderRadius: "6px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2196F3" }}>
                {formatPlaytime(game.playtime_forever)}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.7 }}>
                Playtime
              </div>
            </div>
          </div>

          {/* Perfect Completion Message */}
          <div style={{
            padding: "12px",
            backgroundColor: "rgba(255, 215, 0, 0.1)",
            borderRadius: "6px",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>
              🏆 Perfect Game Achievement
            </div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>
              All {game.achievements} achievements unlocked!
            </div>
          </div>

          <div style={{
            marginTop: "12px",
            fontSize: "11px",
            opacity: 0.6,
            textAlign: "center"
          }}>
            App ID: {game.app_id}
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
};

export const OverallTab: VFC<OverallTabProps> = ({
  overallProgress,
  isLoading,
  onFetchProgress
}) => {
  const getCompletionStats = () => {
    if (!overallProgress || overallProgress.error) return null;
    
    const gamesStarted = overallProgress.games_with_achievements;
    const gamesOwned = overallProgress.total_games;
    const perfectGames = overallProgress.perfect_games_count;
    const unlocked = overallProgress.unlocked_achievements;
    const total = overallProgress.total_achievements;
    
    // Main completion rate
    const unlockRate = total > 0 ? Math.round((unlocked / total) * 1000) / 10 : 0;
    
    // Remaining achievements
    const remaining = total - unlocked;
    
    // Average achievements per game (total/started)
    const avgAchievementsPerGame = gamesStarted > 0 ? Math.round(total / gamesStarted) : 0;
    
    // Perfect game completion rate
    const perfectRate = gamesStarted > 0 ? Math.round((perfectGames / gamesStarted) * 1000) / 10 : 0;
    
    // Games participation rate (started vs owned)
    const participationRate = gamesOwned > 0 ? Math.round((gamesStarted / gamesOwned) * 1000) / 10 : 0;
    
    // Achievement density (unlocked per started game)
    const avgUnlockedPerGame = gamesStarted > 0 ? Math.round(unlocked / gamesStarted) : 0;
    
    // Progress towards next perfect game (games in progress)
    const gamesInProgress = gamesStarted - perfectGames;
    
    // Estimated completion if average continues
    const projectedTotal = gamesStarted > 0 ? Math.round((unlocked / gamesStarted) * gamesOwned) : 0;
    
    return {
      gamesStarted,
      gamesOwned,
      perfectGames,
      unlocked,
      total,
      unlockRate,
      remaining,
      avgAchievementsPerGame,
      perfectRate,
      participationRate,
      avgUnlockedPerGame,
      gamesInProgress,
      projectedTotal
    };
  };

  const stats = getCompletionStats();
  const milestone = overallProgress ? getMilestoneInfo(overallProgress.unlocked_achievements) : null;

  return (
    <div style={{ padding: "0", margin: "0" }}>
      <PanelSection title="Overall Progress">
        {overallProgress && !overallProgress.error ? (
          <>
            {/* Main Progress Bar */}
            <PanelSectionRow>
              <ProgressDisplay
                unlocked={overallProgress.unlocked_achievements}
                total={overallProgress.total_achievements}
              />
            </PanelSectionRow>
            
            {/* Key Statistics Grid */}
            <PanelSectionRow>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "8px"
              }}>
                {/* Games Started */}
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  padding: "10px",
                  borderRadius: "4px"
                }}>
                  <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}>
                    Games Started
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {stats?.gamesStarted || 0}
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.5 }}>
                    of {overallProgress.total_games} owned
                  </div>
                </div>
                
                {/* Perfect Games */}
                <div style={{
                  backgroundColor: "rgba(255,215,0,0.1)",
                  padding: "10px",
                  borderRadius: "4px"
                }}>
                  <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}>
                    Perfect Games
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#FFD700" }}>
                    {overallProgress.perfect_games_count || 0}
                  </div>
                  <div style={{ fontSize: "10px", opacity: 0.5 }}>
                    100% completed
                  </div>
                </div>
              </div>
            </PanelSectionRow>
            
            {/* Detailed Stats */}
            <PanelSectionRow>
              <div style={{ marginTop: "8px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <span style={{ fontSize: "13px", opacity: 0.8 }}>
                    🏆 Overall Completion
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                    {stats?.unlockRate || 0}%
                  </span>
                </div>
                
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <span style={{ fontSize: "13px", opacity: 0.8 }}>
                    📈 Avg Unlocked/Game
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                    {stats?.avgUnlockedPerGame || 0}
                  </span>
                </div>
                
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "6px 0"
                }}>
                  <span style={{ fontSize: "13px", opacity: 0.8 }}>
                    🎯 Achievements Left
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                    {stats?.remaining.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </PanelSectionRow>
            
            {/* Completion Milestones */}
            {milestone && overallProgress.unlocked_achievements > 0 && (
              <PanelSectionRow>
                <div style={{
                  marginTop: "12px",
                  padding: "10px",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderRadius: "4px",
                  borderLeft: "3px solid #4CAF50"
                }}>
                  <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}>
                    🎉 Milestone Progress
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    <span>{milestone.title} - {milestone.description}</span>
                  </div>
                  <div style={{ 
                    fontSize: "10px", 
                    opacity: 0.6, 
                    marginTop: "4px" 
                  }}>
                    Next: {milestone.next}
                  </div>
                </div>
              </PanelSectionRow>
            )}
          </>
        ) : (
          <PanelSectionRow>
            <div style={{ opacity: 0.6, textAlign: "center", padding: "20px" }}>
              {isLoading ? (
                <LoadingSpinner 
                  message="Calculating overall progress..." 
                  size="large" 
                />
              ) : (
                <>
                  <FaChartLine style={{ fontSize: "24px", marginBottom: "8px", opacity: 0.5 }} />
                  <div>No progress data available</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>
                    Click below to calculate your achievement progress
                  </div>
                </>
              )}
            </div>
          </PanelSectionRow>
        )}
        
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={onFetchProgress}
            disabled={isLoading}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
              <FaSync 
                style={{ 
                  fontSize: "12px",
                  animation: isLoading ? "spin 1s linear infinite" : "none"
                }} 
              />
              {isLoading ? "Calculating..." : "Calculate Progress"}
            </div>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      
      {/* Perfect Games Section */}
      {overallProgress?.perfect_games && overallProgress.perfect_games.length > 0 && (
        <PanelSection title="Perfect Games">
          <div style={{ maxHeight: "300px", overflowY: "auto", overflowX: "hidden" }}>
            <Focusable style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {overallProgress.perfect_games.map((game) => (
                <PanelSectionRow key={game.app_id}>
                  <ButtonItem
                    layout="below"
                    onClick={() => {
                      showModal(
                        <PerfectGameModal game={game} />
                      );
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                      <FaTrophy style={{ color: "#FFD700", fontSize: "16px" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{game.name}</div>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                          {game.achievements} achievements
                        </div>
                      </div>
                      <span style={{ color: "#4CAF50", fontWeight: "bold", fontSize: "13px" }}>100%</span>
                    </div>
                  </ButtonItem>
                </PanelSectionRow>
              ))}
            </Focusable>
          </div>
        </PanelSection>
      )}
    </div>
  );
};