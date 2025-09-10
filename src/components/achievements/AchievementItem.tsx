// components/achievements/AchievementItem.tsx
import { VFC, memo } from "react";
import { PanelSectionRow, ButtonItem } from "@decky/ui";
import { FaCheck, FaLock, FaStar } from "../../utils/icons";
import { AchievementItemProps } from "../../models";
import { formatGlobalPercent } from "../../services/formatters";

interface AchievementItemExtendedProps extends AchievementItemProps {
  onClick?: () => void;
}

export const AchievementItem: VFC<AchievementItemExtendedProps> = memo(({
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
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: "8px",
          opacity: achievement.unlocked ? 1 : 0.6,
          padding: "4px 0",
          width: "100%",
          textAlign: "left"
        }}>
          {/* Achievement Icon */}
          {achievement.icon && (
            <img
              src={achievement.unlocked ? achievement.icon : achievement.icon_gray}
              style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "4px",
                flexShrink: 0,
                marginTop: "2px"
              }}
              alt=""
            />
          )}

          {/* Achievement Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: achievement.unlocked ? "bold" : "normal",
              fontSize: "14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "6px",
              marginBottom: "2px",
              lineHeight: "1.3"
            }}>
              <span style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                flex: 1
              }}>
                {achievement.display_name}
              </span>
              <div style={{ 
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                paddingTop: "1px"
              }}>
                {achievement.unlocked && <FaCheck style={{ color: "#4CAF50", fontSize: "12px" }} />}
                {achievement.hidden && !achievement.unlocked && <FaLock style={{ fontSize: "12px", opacity: 0.5 }} />}
              </div>
            </div>
            <div style={{
              fontSize: "12px",
              opacity: 0.7,
              textAlign: "left",
              lineHeight: "1.3",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical"
            }}>
              {!achievement.hidden || achievement.unlocked
                ? achievement.description
                : "Hidden achievement"}
            </div>
          </div>

          {/* Rarity indicator */}
          {(achievement.global_percent !== null && achievement.global_percent !== undefined && !isNaN(achievement.global_percent) && achievement.global_percent > 0) && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "35px",
              flexShrink: 0,
              alignSelf: "flex-start",
              marginTop: "8px"
            }}>
              <FaStar style={{ 
                color: achievement.global_percent <= 1 ? "#FFD700" : 
                       achievement.global_percent <= 5 ? "#FF9800" : 
                       achievement.global_percent <= 15 ? "#FFC107" :
                       achievement.global_percent <= 50 ? "#4CAF50" : "#9E9E9E", 
                fontSize: "14px" 
              }} />
              <span style={{ 
                fontSize: "9px", 
                opacity: 0.8, 
                marginTop: "2px",
                color: achievement.global_percent <= 1 ? "#FFD700" : 
                       achievement.global_percent <= 5 ? "#FF9800" : 
                       achievement.global_percent <= 15 ? "#FFC107" :
                       achievement.global_percent <= 50 ? "#4CAF50" : "#9E9E9E"
              }}>
                {formatGlobalPercent(achievement.global_percent)}
              </span>
            </div>
          )}
        </div>
      </ButtonItem>
    </PanelSectionRow>
  );
});