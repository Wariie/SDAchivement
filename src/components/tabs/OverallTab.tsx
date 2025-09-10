// components/tabs/OverallTab.tsx
import { VFC, memo } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, Focusable, showModal, ConfirmModal } from "@decky/ui";
import { FaChartLine, FaSync, FaTrophy } from "../../utils/icons";
import { OverallProgress, GameInfo } from "../../models";
import { ProgressDisplay } from "../common/ProgressDisplay";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { GameImage } from "../common/GameImage";
import { getMilestoneInfo, formatPlaytime } from "../../services/formatters";
import { useGameArtwork } from "../../hooks/useGameArtwork";
import { modalStyles } from "../../utils/modalStyles";

interface OverallTabProps {
  overallProgress: OverallProgress | null;
  recentlyPlayedGames: GameInfo[];
  isLoading: boolean;
  onFetchRecentlyPlayed: () => Promise<void>;
  onGameClick?: (gameId: number) => void;
}

// Perfect Game List Item Component
const PerfectGameListItem: VFC<{ game: GameInfo }> = memo(({ game }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
      <GameImage
        appId={game.app_id}
        headerImage={game.header_image}
        alt={game.name}
        style={{
          width: "60px",
          height: "28px",
          objectFit: "cover",
          borderRadius: "4px",
          flexShrink: 0
        }}
        fallbackIcon={<FaTrophy style={{ color: "#FFD700", fontSize: "16px", flexShrink: 0 }} />}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{game.name}</div>
        <div style={{ fontSize: "12px", opacity: 0.7 }}>
          {game.total_achievements} achievements
        </div>
      </div>
      <span style={{ color: "#4CAF50", fontWeight: "bold", fontSize: "13px" }}>100%</span>
    </div>
  );
});

// Recently Played Game List Item Component
const RecentlyPlayedGameListItem: VFC<{ game: GameInfo }> = ({ game }) => {
  const { getBestImage } = useGameArtwork(game.app_id);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
      {game.img_icon_url ? (
        <img
          src={`https://media.steampowered.com/steamcommunity/public/images/apps/${game.app_id}/${game.img_icon_url}.jpg`}
          alt={game.name}
          style={{
            width: "32px",
            height: "32px",
            objectFit: "cover",
            borderRadius: "4px",
            flexShrink: 0
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : getBestImage(game.header_image) ? (
        <img
          src={getBestImage(game.header_image)!}
          alt={game.name}
          style={{
            width: "32px",
            height: "32px",
            objectFit: "cover",
            borderRadius: "4px",
            flexShrink: 0
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div style={{ width: "32px", height: "32px", backgroundColor: "#333", borderRadius: "4px", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{game.name}</div>
        <div style={{ fontSize: "12px", opacity: 0.7 }}>
          {formatPlaytime(game.playtime_forever || 0)}
          {game.has_achievements && game.total_achievements && game.total_achievements > 0 && (
            <span style={{ marginLeft: "8px" }}>
              • {game.unlocked_achievements || 0}/{game.total_achievements} achievements ({game.achievement_percentage?.toFixed(1) || "0"}%)
            </span>
          )}
        </div>
      </div>
      {game.playtime_2weeks && game.playtime_2weeks > 0 && (
        <div style={{
          fontSize: "11px",
          opacity: 0.8,
          textAlign: "right"
        }}>
          <div>2 weeks:</div>
          <div>{formatPlaytime(game.playtime_2weeks)}</div>
        </div>
      )}
    </div>
  );
};

// Recently Played Game Modal Component
const RecentlyPlayedGameModal: VFC<{ game: GameInfo; closeModal?: () => void }> = ({ game, closeModal }) => {
  const { getBestImage } = useGameArtwork(game.app_id);

  return (
    <ConfirmModal
      strTitle=""
      onOK={closeModal}
      onCancel={closeModal}
      strOKButtonText="Close"
      bHideCloseIcon={false}
    >
      <div style={modalStyles.container}>
        {/* Hero Image Banner */}
        <div style={modalStyles.heroImageBanner}>
          {(() => {
            // Trust getBestImage to handle all fallbacks including Steam CDN
            const imageUrl = getBestImage(game.header_image);

            return imageUrl ? (
              <img
                src={imageUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.8
                }}
                alt={game.name}
                onError={(e) => {
                  // If image fails to load, hide it gracefully  
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null;
          })()}

          {/* Overlay with gradient */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)"
          }} />

          {/* Title and Status Badge */}
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
                backgroundColor: "#2196F3",
                color: "white",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "bold",
                marginLeft: "8px"
              }}>
                🎮 RECENT
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ padding: "0 16px 8px" }}>
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
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2196F3" }}>
                {formatPlaytime(game.playtime_forever || 0)}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.7 }}>
                Total Playtime
              </div>
            </div>

            {game.playtime_2weeks ? (
              <div style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                padding: "12px",
                borderRadius: "6px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4CAF50" }}>
                  {formatPlaytime(game.playtime_2weeks)}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.7 }}>
                  Last 2 Weeks
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                padding: "12px",
                borderRadius: "6px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#FF9800" }}>
                  {game.has_achievements ? (game.total_achievements || 0) : "N/A"}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.7 }}>
                  Achievements
                </div>
              </div>
            )}
          </div>

          {/* Achievement Progress */}
          {game.has_achievements && game.total_achievements && game.total_achievements > 0 && (
            <div style={{
              padding: "12px",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              borderRadius: "6px",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              textAlign: "center",
              marginBottom: "12px"
            }}>
              <div style={{ fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>
                🏆 Achievement Progress
              </div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#4CAF50", marginBottom: "2px" }}>
                {game.unlocked_achievements || 0} / {game.total_achievements}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>
                {game.achievement_percentage?.toFixed(1) || "0"}% completed
              </div>
            </div>
          )}

        </div>
      </div>
    </ConfirmModal>
  );
};

// Enhanced Perfect Game Modal Component
const PerfectGameModal: VFC<{ game: GameInfo; closeModal?: () => void }> = ({ game, closeModal }) => {
  const { getBestImage } = useGameArtwork(game.app_id);

  return (
    <ConfirmModal
      strTitle=""
      onOK={closeModal}
      onCancel={closeModal}
      strOKButtonText="Close"
      bHideCloseIcon={false}
    >
      <div style={modalStyles.container}>
        {/* Hero Image Banner */}
        <div style={modalStyles.heroImageBanner}>
          {(() => {
            // Trust getBestImage to handle all fallbacks including Steam CDN
            const imageUrl = getBestImage(game.header_image);

            return imageUrl ? (
              <img
                src={imageUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.8
                }}
                alt={game.name}
                onError={(e) => {
                  // If image fails to load, hide it gracefully
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null;
          })()}

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
        <div style={{ padding: "0 16px 8px" }}>
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
                {game.total_achievements}
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
                {formatPlaytime(game.playtime_forever || 0)}
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
              All {game.total_achievements} achievements unlocked!
            </div>
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
};

export const OverallTab: VFC<OverallTabProps> = ({
  overallProgress,
  recentlyPlayedGames,
  isLoading,
  onFetchRecentlyPlayed
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

      </PanelSection>

      {/* Recently Played Games Section */}
      {recentlyPlayedGames?.length > 0 && (
        <PanelSection title="Recently Played Games">
          <div>
            <Focusable style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {recentlyPlayedGames.map((game) => (
                <PanelSectionRow key={game.app_id}>
                  <ButtonItem
                    layout="below"
                    onClick={() => {
                      showModal(
                        <RecentlyPlayedGameModal game={game} />
                      );
                    }}
                  >
                    <RecentlyPlayedGameListItem game={game} />
                  </ButtonItem>
                </PanelSectionRow>
              ))}
            </Focusable>
          </div>
          <PanelSectionRow>
            <div style={{ 
              textAlign: "center", 
              padding: "8px", 
              fontSize: "11px", 
              opacity: 0.6,
              borderRadius: "4px",
              backgroundColor: "rgba(255,255,255,0.03)"
            }}>
              Recently played games from Steam library
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Load Recently Played Button - when no games are loaded */}
      {!recentlyPlayedGames?.length && (
        <PanelSection>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={onFetchRecentlyPlayed}
              disabled={isLoading}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <FaSync
                  style={{
                    fontSize: "12px",
                    animation: isLoading ? "spin 1s linear infinite" : "none"
                  }}
                />
                {isLoading ? "Loading..." : "Load Recently Played Games"}
              </div>
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Perfect Games Section */}
      {overallProgress?.perfect_games && overallProgress.perfect_games.length > 0 && (
        <PanelSection title="Perfect Games">
          <div>
            <Focusable style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {overallProgress.perfect_games!.map((game) => (
                <PanelSectionRow key={game.app_id}>
                  <ButtonItem
                    layout="below"
                    onClick={() => {
                      showModal(
                        <PerfectGameModal game={game} />
                      );
                    }}
                  >
                    <PerfectGameListItem game={game} />
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