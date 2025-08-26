// components/game/GameInfoCard.tsx
import { VFC } from "react";
import { GameInfo, Achievement } from "../../models";
import { formatGlobalPercent } from "../../services/formatters";

interface GameInfoCardProps {
  game: GameInfo;
  rarestAchievement?: Achievement | null;
}

export const GameInfoCard: VFC<GameInfoCardProps> = ({ game, rarestAchievement }) => {
  return (
    <div style={{ padding: "15px" }}>
      {/* Game Header */}
      <div style={{ marginBottom: "15px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "bold" }}>
          {game.name}
        </h3>
        <div style={{ fontSize: "14px", opacity: 0.7 }}>
          App ID: {game.app_id}
        </div>
      </div>

      {/* Game Image */}
      {game.header_image && (
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <img
            src={game.header_image}
            style={{
              maxWidth: "100%",
              borderRadius: "8px",
              maxHeight: "200px"
            }}
            alt={game.name}
          />
        </div>
      )}

      {/* Achievement Stats */}
      <div style={{ marginBottom: "15px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}>
          <span>Total Achievements:</span>
          <span style={{ fontWeight: "bold" }}>{game.achievements}</span>
        </div>

        {game.has_achievements && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <span>Status:</span>
            <span style={{ color: "#4CAF50", fontWeight: "bold" }}>100% Complete</span>
          </div>
        )}
      </div>

      {/* Rarest Achievement */}
      {rarestAchievement && (
        <div style={{ marginTop: "15px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", opacity: 0.8 }}>
            Rarest Achievement
          </h4>
          <div style={{
            padding: "10px",
            backgroundColor: "rgba(255,215,0,0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(255,215,0,0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {rarestAchievement.icon && (
                <img
                  src={rarestAchievement.icon}
                  style={{ width: "32px", height: "32px", borderRadius: "4px" }}
                  alt=""
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "13px" }}>
                  {rarestAchievement.display_name}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.7 }}>
                  {rarestAchievement.description}
                </div>
                {rarestAchievement.global_percent !== null && (
                  <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "2px" }}>
                    Rarity: {formatGlobalPercent(rarestAchievement.global_percent)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};