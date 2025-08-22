// components/game/GameBanner.tsx
import { VFC } from "react";
import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaGamepad, FaSync } from "react-icons/fa";
import { GameBannerProps } from "../../models";

export const GameBanner: VFC<GameBannerProps> = ({ game, isLoading, onRefresh }) => {
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
        {game.header_image && (
          <img 
            src={game.header_image}
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
    </>
  );
};