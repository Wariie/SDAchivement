// components/tabs/OverallTab.tsx
import { VFC } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, Focusable } from "@decky/ui";
import { FaChartLine, FaSync, FaTrophy } from "react-icons/fa";
import { OverallProgress } from "../../models";
import { ProgressDisplay } from "../common/ProgressDisplay";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { getMilestoneInfo } from "../../services/formatters";

interface OverallTabProps {
  overallProgress: OverallProgress | null;
  isLoading: boolean;
  onFetchProgress: () => Promise<void>;
  onGameClick?: (gameId: number) => void;
}

export const OverallTab: VFC<OverallTabProps> = ({
  overallProgress,
  isLoading,
  onFetchProgress,
  onGameClick
}) => {
  const getCompletionStats = () => {
    if (!overallProgress || overallProgress.error) return null;
    
    const gamesStarted = overallProgress.games_with_achievements;
    const unlockRate = overallProgress.total_achievements > 0
      ? Math.round((overallProgress.unlocked_achievements / overallProgress.total_achievements * 100) * 10) / 10
      : 0;
    const remaining = overallProgress.total_achievements - overallProgress.unlocked_achievements;
    const avgAchievementsPerGame = gamesStarted > 0
      ? Math.round(overallProgress.total_achievements / gamesStarted)
      : 0;
    
    return {
      gamesStarted,
      unlockRate,
      remaining,
      avgAchievementsPerGame
    };
  };

  const stats = getCompletionStats();
  const milestone = overallProgress ? getMilestoneInfo(overallProgress.unlocked_achievements) : null;

  return (
    <>
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
              <div className="stats-grid">
                {/* Games Started */}
                <div className="stat-card">
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
                <div className="stat-card perfect-games">
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
                {/* Overall Unlock Rate */}
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
                
                {/* Average Per Game */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <span style={{ fontSize: "13px", opacity: 0.8 }}>
                    📊 Avg per Started Game
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                    {overallProgress.average_completion || 0}%
                  </span>
                </div>
                
                {/* Achievements Remaining */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <span style={{ fontSize: "13px", opacity: 0.8 }}>
                    🎯 Achievements Left
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                    {stats?.remaining.toLocaleString() || 0}
                  </span>
                </div>
                
                {/* Average Achievements per Game */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "6px 0"
                }}>
                  <span style={{ fontSize: "13px", opacity: 0.8 }}>
                    📈 Avg per Game
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                    {stats?.avgAchievementsPerGame || 0} achievements
                  </span>
                </div>
              </div>
            </PanelSectionRow>
            
            {/* Completion Milestones */}
            {milestone && overallProgress.unlocked_achievements > 0 && (
              <PanelSectionRow>
                <div className="milestone-display">
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaSync className={isLoading ? "spinning" : ""} />
              {isLoading ? "Calculating..." : "Calculate Progress"}
            </div>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      
      {/* Perfect Games Section */}
      {overallProgress?.perfect_games && overallProgress.perfect_games.length > 0 && (
        <PanelSection title="Perfect Games">
          <div style={{ maxHeight: "300px", overflowY: "auto", overflowX: "hidden" }}>
            <Focusable className="no-gap-list">
              {overallProgress.perfect_games.map((game) => (
                <PanelSectionRow key={game.app_id}>
                  <ButtonItem
                    layout="below"
                    onClick={() => onGameClick?.(game.app_id)}
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
};