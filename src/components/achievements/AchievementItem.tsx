// components/achievements/AchievementItem.tsx
import { VFC } from "react";
import { PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaCheck, FaLock, FaStar } from "react-icons/fa";
import { AchievementItemProps } from "../../models";
import { formatGlobalPercent } from "../../services/formatters";

interface AchievementItemExtendedProps extends AchievementItemProps {
  onClick?: () => void;
}

export const AchievementItem: VFC<AchievementItemExtendedProps> = ({
  achievement,
  onClick
}) => {
  return (
    <PanelSectionRow>
      <ButtonItem
        layout="below"
        onClick={onClick}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          opacity: achievement.unlocked ? 1 : 0.6
        }}>
          {/* Achievement Icon */}
          {achievement.icon && (
            <img
              src={achievement.unlocked ? achievement.icon : achievement.icon_gray}
              style={{ width: "32px", height: "32px", borderRadius: "4px" }}
              alt=""
            />
          )}

          {/* Achievement Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: achievement.unlocked ? "bold" : "normal",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              {achievement.display_name}
              {achievement.unlocked && <FaCheck style={{ color: "#4CAF50", fontSize: "12px" }} />}
              {achievement.hidden && !achievement.unlocked && <FaLock style={{ fontSize: "12px", opacity: 0.5 }} />}
            </div>
            <div style={{
              fontSize: "12px",
              opacity: 0.7,
              marginTop: "2px"
            }}>
              {!achievement.hidden || achievement.unlocked
                ? achievement.description
                : "Hidden achievement"}
            </div>
          </div>

          {/* Rarity indicator */}
          {achievement.global_percent !== null && achievement.global_percent <= 10 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "40px"
            }}>
              <FaStar style={{ color: "#FFD700", fontSize: "16px" }} />
              <span style={{ fontSize: "10px", opacity: 0.8 }}>
                {formatGlobalPercent(achievement.global_percent)}
              </span>
            </div>
          )}
        </div>
      </ButtonItem>
    </PanelSectionRow>
  );
};