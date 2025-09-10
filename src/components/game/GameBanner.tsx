// components/game/GameBanner.tsx
import { VFC } from "react";
import { PanelSection, PanelSectionRow } from "@decky/ui";
import { FaBullseye, FaPlay } from "../../utils/icons";
import { GameBannerProps } from "../../models";
import { useGameArtwork } from "../../hooks/useGameArtwork";
import { NoGameDisplay } from "./NoGameDisplay";
import { GameInfoDisplay } from "./GameInfoDisplay";
import { TrackingControls } from "./TrackingControls";

export const GameBanner: VFC<GameBannerProps> = ({
  game,
  isLoading: _isLoading,
  onRefresh: _onRefresh,
  trackedGame,
  onSetTrackedGame,
  onClearTrackedGame,
  onSelectTrackedGame,
  onViewModeChange,
  viewMode = "current"
}) => {
  // Early return for no game
  if (!game) {
    return <NoGameDisplay 
      onSelectTracked={onSelectTrackedGame}
      onSetTrackedGame={onSetTrackedGame}
      onClearTrackedGame={onClearTrackedGame}
      trackedGame={trackedGame}
      viewMode={viewMode}
    />;
  }

  // Load artwork and prepare display data
  const { getBestImage } = useGameArtwork(game.app_id || null, false);
  const isTestMode = game.name.startsWith("[TEST]");
  const displayName = game.name.replace("[TEST] ", "");

  return (
    <>
      {/* Game Banner */}
      <div style={{
        position: "relative",
        borderRadius: "8px",
        overflow: "hidden",
        marginBottom: "12px",
        minHeight: "80px",
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
      }}>
        {/* Background Image */}
        {(() => {
          const imageUrl = getBestImage(game.header_image);
          return imageUrl && (
            <img
              src={imageUrl}
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
          );
        })()}

        {/* Overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)"
        }} />

        {/* Test Mode Badge */}
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
              fontWeight: "bold"
            }}>
              TEST
            </span>
          </div>
        )}

        {/* Top Right Visual Toggle */}
        {trackedGame && onViewModeChange && (
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

        {/* Game Info */}
        <GameInfoDisplay 
          game={game}
          displayName={displayName}
        />
      </div>

      {/* Test Mode Warning */}
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
      <TrackingControls 
        game={game}
        trackedGame={trackedGame}
        viewMode={viewMode}
        onSetTracked={onSetTrackedGame}
        onClearTracked={onClearTrackedGame}
        onSelectTracked={onSelectTrackedGame}
      />
    </>
  );
};