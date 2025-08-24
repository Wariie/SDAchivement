// components/game/GameBanner.tsx
import { VFC } from "react";
import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaGamepad, FaSync, FaEye, FaTimes, FaPlus, FaPlay, FaBullseye } from "../../utils/icons";
import { GameBannerProps } from "../../models";
import { useGameArtwork } from "../../hooks/useGameArtwork";
import { formatPlaytime } from "../../services/formatters";

export const GameBanner: VFC<GameBannerProps> = ({ 
  game, 
  isLoading, 
  onRefresh,
  trackedGame,
  onSetTrackedGame,
  onClearTrackedGame,
  onSelectTrackedGame,
  viewMode,
  currentGame,
  onViewModeChange
}) => {
  // Load local artwork for better images
  const { getBestImage } = useGameArtwork(game?.app_id || null);
  if (!game) {
    return (
      <PanelSection>
        <PanelSectionRow>
          <div style={{ 
            textAlign: "center", 
            padding: "20px",
            opacity: 0.6 
          }}>
            <FaGamepad style={{ fontSize: "32px", marginBottom: "8px" }} />
            <div>No game currently running</div>
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaSync style={{ fontSize: "14px" }} />
              Check for Game
            </div>
          </ButtonItem>
        </PanelSectionRow>
        
        {/* Add tracking selection when no game */}
        {onSelectTrackedGame && (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={onSelectTrackedGame}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaEye style={{ fontSize: "14px" }} />
                {viewMode === "current" ? "Track a Game" : "Select Game to Track"}
              </div>
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>
    );
  }

  const isTestMode = game.name.startsWith("[TEST]");
  const displayName = game.name.replace("[TEST] ", "");

  return (
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
        {getBestImage(game.header_image) && (
          <img 
            src={getBestImage(game.header_image)!}
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
        
        {/* Top Left Pills - Only Test Mode */}
        {isTestMode && (
          <div style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            zIndex: 10
          }}>
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
          </div>
        )}

        {/* Top Right Visual Toggle */}
        {trackedGame && currentGame && onViewModeChange && trackedGame.app_id !== currentGame.app_id && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              display: "flex",
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: "16px",
              padding: "2px",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              zIndex: 10
            }}
            onClick={() => onViewModeChange(viewMode === "current" ? "tracked" : "current")}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.6)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.4)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
          >
            {/* Current Mode Option */}
            <div
              style={{
                padding: "6px 8px",
                borderRadius: "12px",
                backgroundColor: viewMode === "current" ? "rgba(76, 175, 80, 0.8)" : "transparent",
                color: viewMode === "current" ? "white" : "rgba(255,255,255,0.6)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                fontWeight: "bold",
                textShadow: viewMode === "current" ? "0 1px 2px rgba(0,0,0,0.5)" : "none"
              }}
            >
              <FaPlay style={{ fontSize: "8px" }} />
              <span>LIVE</span>
            </div>
            
            {/* Tracked Mode Option */}
            <div
              style={{
                padding: "6px 8px",
                borderRadius: "12px",
                backgroundColor: viewMode === "tracked" ? "rgba(33, 150, 243, 0.8)" : "transparent",
                color: viewMode === "tracked" ? "white" : "rgba(255,255,255,0.6)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                fontWeight: "bold",
                textShadow: viewMode === "tracked" ? "0 1px 2px rgba(0,0,0,0.5)" : "none"
              }}
            >
              <FaBullseye style={{ fontSize: "8px" }} />
              <span>TRACK</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{
          position: "relative",
          padding: "12px 16px",
          paddingRight: (trackedGame && currentGame && onViewModeChange && trackedGame.app_id !== currentGame.app_id) ? "100px" : "16px",
          height: "80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: "white"
        }}>
          <h3 style={{
            margin: "0 0 4px 0",
            fontSize: "16px",
            fontWeight: "bold",
            textShadow: "1px 1px 2px rgba(0,0,0,0.7)"
          }}>
            {displayName}
          </h3>
          
          <div style={{ fontSize: "12px", opacity: 0.9, textShadow: "1px 1px 1px rgba(0,0,0,0.5)" }}>
            {/* Always show achievement count if available */}
            {((game.achievement_count && game.achievement_count > 0) || 
              (game.achievements && game.achievements > 0) || 
              game.has_achievements) && (
              <div>{game.achievement_count || game.achievements || 0} achievements available</div>
            )}
            {/* Show playtime if available */}
            {game.playtime_forever !== undefined && game.playtime_forever >= 0 && (
              <div>Playtime: {formatPlaytime(game.playtime_forever)}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Test mode warning */}
      {isTestMode && (
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
      
      {/* Tracking Controls */}
      {onSetTrackedGame && onClearTrackedGame && onSelectTrackedGame && (
        <PanelSection>
          {/* Current game tracking controls */}
          {viewMode === "current" && game && !trackedGame && (
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => onSetTrackedGame({ app_id: game.app_id, name: game.name })}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                  <FaPlus style={{ fontSize: "12px" }} />
                  Track This Game
                </div>
              </ButtonItem>
            </PanelSectionRow>
          )}
          
          {/* Tracked game controls */}
          {viewMode === "tracked" && trackedGame && (
            <>
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={onSelectTrackedGame}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                    <FaEye style={{ fontSize: "12px" }} />
                    Change Tracked Game
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={async () => {
                    if (onClearTrackedGame) {
                      try {
                        await onClearTrackedGame();
                      } catch (error) {
                        console.error("GameBanner: Clear tracked game failed:", error);
                      }
                    } else {
                      console.error("GameBanner: onClearTrackedGame is not defined");
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                    <FaTimes style={{ fontSize: "12px" }} />
                    Clear Tracked Game
                  </div>
                </ButtonItem>
              </PanelSectionRow>
            </>
          )}
        </PanelSection>
      )}
    </>
  );
};