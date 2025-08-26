// components/achievements/AchievementDetailsModal.tsx
import { VFC } from "react";
import { ConfirmModal } from "@decky/ui";
import { Achievement } from "../../models";
import { formatTime, formatGlobalPercent } from "../../services/formatters";

interface AchievementDetailsModalProps {
  achievement: Achievement;
  closeModal?: () => void;
}

export const AchievementDetailsModal: VFC<AchievementDetailsModalProps> = ({
  achievement,
  closeModal
}) => {
  return (
    <ConfirmModal
      strTitle={achievement.display_name}
      onOK={closeModal}
      onCancel={closeModal}
      strOKButtonText="Close"
      bHideCloseIcon={false}
    >
      <div style={{ padding: "10px" }}>
        {achievement.icon && (
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <img
              src={achievement.unlocked ? achievement.icon : achievement.icon_gray}
              style={{ width: "64px", height: "64px", borderRadius: "8px" }}
              alt=""
            />
          </div>
        )}

        <div style={{ marginBottom: "10px" }}>
          <strong>Description:</strong><br />
          {!achievement.hidden || achievement.unlocked
            ? achievement.description
            : "Hidden achievement"}
        </div>

        {achievement.global_percent !== null && !isNaN(achievement.global_percent) && (
          <div style={{ marginBottom: "10px" }}>
            <strong>Rarity:</strong> {formatGlobalPercent(achievement.global_percent)} of players
          </div>
        )}

        {achievement.unlocked && achievement.unlock_time && (
          <div style={{ marginBottom: "10px" }}>
            <strong>Unlocked:</strong> {formatTime(achievement.unlock_time)}
          </div>
        )}

        <div style={{
          marginTop: "15px",
          padding: "10px",
          backgroundColor: achievement.unlocked ? "rgba(76, 175, 80, 0.1)" : "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          textAlign: "center"
        }}>
          {achievement.unlocked ? "✓ Unlocked" : "🔒 Locked"}
        </div>
      </div>
    </ConfirmModal>
  );
};