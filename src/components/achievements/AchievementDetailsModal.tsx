// components/achievements/AchievementDetailsModal.tsx
import { VFC } from "react";
import { ConfirmModal } from "@decky/ui";
import { Achievement } from "../../models";
import { formatTime, formatGlobalPercent } from "../../services/formatters";

interface AchievementDetailsModalProps {
  achievement: Achievement;
  gameName?: string;
  closeModal?: () => void;
}

export const AchievementDetailsModal: VFC<AchievementDetailsModalProps> = ({
  achievement,
  gameName,
  closeModal
}) => {
  return (
    <ConfirmModal
      strTitle=""
      onOK={closeModal}
      onCancel={closeModal}
      strOKButtonText="Close"
      bHideCloseIcon={false}
    >
      <div style={{ 
        padding: "0",
        width: "100%",
        margin: "0 auto"
      }}>
        {/* Header Section with Icon and Title */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
          padding: "24px 32px",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          {achievement.icon && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={achievement.unlocked ? achievement.icon : achievement.icon_gray}
                style={{ 
                  width: "64px", 
                  height: "64px", 
                  borderRadius: "8px",
                  border: "2px solid rgba(255, 255, 255, 0.1)"
                }}
                alt=""
              />
            </div>
          )}
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              fontWeight: "600",
              lineHeight: "1.3",
              color: achievement.unlocked ? "#4CAF50" : "#ffffff",
              wordBreak: "break-word"
            }}>
              {achievement.display_name}
            </h2>
            
            {gameName && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                backgroundColor: "rgba(25, 118, 210, 0.15)",
                borderRadius: "12px",
                border: "1px solid rgba(25, 118, 210, 0.3)",
                marginTop: "4px"
              }}>
                <span style={{ 
                  fontSize: "12px", 
                  color: "#64B5F6",
                  fontWeight: "500"
                }}>
                  {gameName}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div style={{
            flexShrink: 0,
            padding: "6px 12px",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "600",
            backgroundColor: achievement.unlocked 
              ? "rgba(76, 175, 80, 0.2)" 
              : "rgba(158, 158, 158, 0.2)",
            color: achievement.unlocked ? "#4CAF50" : "#9E9E9E",
            border: `1px solid ${achievement.unlocked ? "rgba(76, 175, 80, 0.4)" : "rgba(158, 158, 158, 0.4)"}`
          }}>
            {achievement.unlocked ? "✓ UNLOCKED" : "🔒 LOCKED"}
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: "24px 32px" }}>
          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{
              margin: "0 0 8px 0",
              fontSize: "14px",
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.9)",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              Description
            </h3>
            <p style={{
              margin: "0",
              fontSize: "15px",
              lineHeight: "1.5",
              color: "rgba(255, 255, 255, 0.85)",
              fontStyle: (!achievement.hidden || achievement.unlocked) ? "normal" : "italic"
            }}>
              {!achievement.hidden || achievement.unlocked
                ? achievement.description
                : "This achievement is hidden until unlocked"}
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: (achievement.global_percent !== null && !isNaN(achievement.global_percent)) && 
                                 (achievement.unlocked && achievement.unlock_time) 
                                 ? "1fr 1fr" : "1fr",
            gap: "20px",
            marginBottom: "24px"
          }}>
            {/* Rarity */}
            {achievement.global_percent !== null && !isNaN(achievement.global_percent) && (
              <div style={{
                padding: "16px 20px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}>
                <div style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontWeight: "500",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Rarity
                </div>
                <div style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: achievement.global_percent <= 5 ? "#FFD700" : 
                         achievement.global_percent <= 15 ? "#FF9800" : "#4CAF50"
                }}>
                  {formatGlobalPercent(achievement.global_percent)}
                </div>
                <div style={{
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.5)",
                  marginTop: "2px"
                }}>
                  of players
                </div>
              </div>
            )}

            {/* Unlock Time */}
            {achievement.unlocked && achievement.unlock_time && (
              <div style={{
                padding: "16px 20px",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderRadius: "10px",
                border: "1px solid rgba(76, 175, 80, 0.2)"
              }}>
                <div style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontWeight: "500",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Unlocked
                </div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#4CAF50",
                  lineHeight: "1.3"
                }}>
                  {formatTime(achievement.unlock_time)}
                </div>
              </div>
            )}
          </div>

          {/* Achievement Type/Hidden Info */}
          {achievement.hidden && !achievement.unlocked && (
            <div style={{
              padding: "16px 20px",
              backgroundColor: "rgba(158, 158, 158, 0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(158, 158, 158, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{ fontSize: "16px" }}>🔒</span>
              <div>
                <div style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "rgba(255, 255, 255, 0.7)"
                }}>
                  Hidden Achievement
                </div>
                <div style={{
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.5)"
                }}>
                  Details will be revealed when unlocked
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ConfirmModal>
  );
};