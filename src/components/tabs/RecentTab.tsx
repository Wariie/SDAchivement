// components/tabs/RecentTab.tsx
import { VFC } from "react";
import {
  PanelSection,
  PanelSectionRow,
  Focusable
} from "@decky/ui";
import { RecentAchievement } from "../../models";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RecentAchievementItem } from "../achievements/RecentAchievementItem";

interface RecentTabProps {
  recentAchievements: RecentAchievement[];
  isLoading: boolean;
}

export const RecentTab: VFC<RecentTabProps> = ({
  recentAchievements,
  isLoading,
}) => {
  return (
    <PanelSection title="Recent Achievements">
      {recentAchievements?.length > 0 ? (
        <div>
          <Focusable style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recentAchievements.map((achievement, index) => (
              <RecentAchievementItem
                key={`${achievement.game_id}-${achievement.achievement_name}-${index}`}
                achievement={achievement}
              />
            ))}
          </Focusable>
        </div>
      ) : (
        <PanelSectionRow>
          <div style={{ opacity: 0.6, textAlign: "center", padding: "15px", fontSize: "14px" }}>
            {isLoading ? (
              <LoadingSpinner message="Loading recent achievements..." size="small" />
            ) : (
              <>
                <div>No recent achievements found</div>
                <div style={{ fontSize: "12px", marginTop: "8px", opacity: 0.8 }}>
                  Steam API has 5-15 minute delay for new achievements
                </div>
              </>
            )}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};