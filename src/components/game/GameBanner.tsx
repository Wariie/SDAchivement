// components/game/GameBanner.tsx
import { VFC } from "react";
import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaGamepad, FaSync, FaEye, FaTimes, FaPlus } from "react-icons/fa";
import { GameBannerProps } from "../../models";
import { useGameArtwork } from "../../hooks/useGameArtwork";

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
              {displayName}
            </h3>
            
            {/* Mode indicators */}
            <div style={{ display: "flex", gap: "4px" }}>
              {/* Test mode indicator */}
              {isTestMode && (
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
              
              {/* Tracked game indicator - only show when games are different */}
              {viewMode === "tracked" && trackedGame && onViewModeChange && currentGame && 
               trackedGame.app_id !== currentGame.app_id && (
                <span 
                  style={{
                    backgroundColor: "#2196F3",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    textShadow: "none",
                    cursor: "pointer"
                  }}
                  onClick={() => onViewModeChange("current")}
                >
                  TRACKED
                </span>
              )}
              
              {/* Current game indicator - only show when games are different */}
              {viewMode === "current" && currentGame && trackedGame && onViewModeChange && 
               trackedGame.app_id !== currentGame.app_id && (
                <span 
                  style={{
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    textShadow: "none",
                    cursor: "pointer"
                  }}
                  onClick={() => onViewModeChange("tracked")}
                >
                  CURRENT
                </span>
              )}
            </div>
          </div>
          
          {game.has_achievements && (
            <div style={{
              fontSize: "12px",
              opacity: 0.9,
              textShadow: "1px 1px 1px rgba(0,0,0,0.5)"
            }}>
              {game.achievements} achievements available
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
          onClick={isLoading ? undefined : onRefresh}
        >
          <FaSync 
            style={{ 
              fontSize: "12px", 
              color: "white",
              animation: isLoading ? "spin 1s linear infinite" : "none"
            }} 
          />
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
                    console.log("GameBanner: Clear tracked game clicked");
                    if (onClearTrackedGame) {
                      try {
                        await onClearTrackedGame();
                        console.log("GameBanner: Clear tracked game completed");
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