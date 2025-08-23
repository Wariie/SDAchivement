import React from "react";
import { PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaGamepad, FaLock, FaTrophy, FaClock, FaStar } from "react-icons/fa";
import { GameInfo } from "../models";

// Achievement type for rarest achievement
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

// Props for the card
interface GameInfoCardProps {
  game: GameInfo;
  rarestAchievement?: Achievement | null;
  onDetailsClick?: (game: GameInfo) => void;
}

function formatPlaytime(minutes?: number) {
  if (!minutes || minutes <= 0) return "No playtime";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0
    ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}`
    : `${mins} min`;
}

export const GameInfoCard: React.VFC<GameInfoCardProps> = ({
  game,
  rarestAchievement,
  onDetailsClick,
}) => {
  return (
    <PanelSectionRow>
      <ButtonItem
        layout="below"
        onClick={() => onDetailsClick?.(game)}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "8px",
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          borderRadius: "8px",
          minHeight: "80px",
          color: "white",
          position: "relative"
        }}>
          {/* Banner */}
          {game.header_image && (
            <img
              src={game.header_image}
              alt=""
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "6px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}
            />
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: "bold",
              fontSize: "18px",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              {game.name}
              {game.is_running ? (
                <FaGamepad style={{ color: "#4CAF50", fontSize: "16px" }} title="Running" />
              ) : (
                <FaLock style={{ color: "#999", fontSize: "14px" }} title="Not Running" />
              )}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.85 }}>
              App ID: <span style={{ fontFamily: "monospace" }}>{game.app_id}</span>
            </div>
            {game.has_achievements && (
              <div style={{
                fontSize: "13px",
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <FaTrophy style={{ color: "#FFD700", fontSize: "14px" }} />
                <span>{game.achievements} achievements available</span>
              </div>
            )}
            {/* Playtime */}
            <div style={{ fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", opacity: 0.85 }}>
              <FaClock style={{ fontSize: "12px" }} />
              {formatPlaytime(game.playtime_forever)}
            </div>
            {/* Rarest Achievement */}
            {rarestAchievement && (
              <div style={{
                fontSize: "12px",
                marginTop: "8px",
                background: "rgba(255,255,255,0.07)",
                borderRadius: "4px",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {rarestAchievement.icon ? (
                  <img
                    src={rarestAchievement.icon}
                    alt=""
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px"
                    }}
                  />
                ) : (
                  <FaStar style={{ color: "#FFD700", fontSize: "18px" }} />
                )}
                <span style={{ fontWeight: "bold" }}>
                  {rarestAchievement.display_name}
                </span>
                <span style={{ opacity: 0.7 }}>
                  {rarestAchievement.global_percent !== null
                    ? `${rarestAchievement.global_percent.toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
            )}
          </div>
        </div>
      </ButtonItem>
    </PanelSectionRow>
  );
};

