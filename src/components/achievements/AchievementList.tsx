// components/achievements/AchievementList.tsx
import { VFC, useMemo } from "react";
import { Focusable } from "@decky/ui";
import { AchievementListProps, Achievement } from "../../models";
import { AchievementItem } from "./AchievementItem";
import { AchievementDetailsModal } from "./AchievementDetailsModal";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { showModal } from "@decky/ui";

export const AchievementList: VFC<AchievementListProps> = ({ 
  achievements, 
  sortBy, 
  showHidden, 
  filterRarity,
  showUnlockedOnly = false,
  showLockedOnly = false,
  isLoading = false
}) => {
  const sortedAchievements = useMemo(() => {
    if (!achievements?.length) return [];
    
    let filtered = [...achievements];
    
    // Filter by rarity
    if (filterRarity > 0) {
      filtered = filtered.filter(a => 
        a.global_percent !== null && 
        !isNaN(a.global_percent) && 
        a.global_percent <= filterRarity
      );
    }
    
    // Filter hidden if not showing
    if (!showHidden) {
      filtered = filtered.filter(a => !a.hidden || a.unlocked);
    }
    
    // Filter by unlock status
    if (showUnlockedOnly) {
      filtered = filtered.filter(a => a.unlocked);
    } else if (showLockedOnly) {
      filtered = filtered.filter(a => !a.unlocked);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.display_name.localeCompare(b.display_name);
        case "rarity":
          const aPercent = (a.global_percent !== null && !isNaN(a.global_percent)) ? a.global_percent : 100;
          const bPercent = (b.global_percent !== null && !isNaN(b.global_percent)) ? b.global_percent : 100;
          return aPercent - bPercent;
        case "unlock":
        default:
          // Unlocked first, then by time
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          if (a.unlocked && b.unlocked) {
            return (b.unlock_time || 0) - (a.unlock_time || 0);
          }
          return 0;
      }
    });
    
    return filtered;
  }, [achievements, sortBy, showHidden, filterRarity, showUnlockedOnly, showLockedOnly]);

  const handleAchievementClick = (achievement: Achievement) => {
    showModal(
      <AchievementDetailsModal achievement={achievement} />
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading achievements..." size="small" />;
  }

  if (!sortedAchievements.length) {
    return (
      <div style={{ 
        textAlign: "center", 
        opacity: 0.6, 
        padding: "20px",
        fontSize: "14px"
      }}>
        No achievements found
      </div>
    );
  }

  return (
    <Focusable style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 0, 
      padding: 0, 
      margin: 0 
    }}>
      {sortedAchievements.map((achievement) => (
        <AchievementItem 
          key={achievement.api_name} 
          achievement={achievement}
          onClick={() => handleAchievementClick(achievement)}
        />
      ))}
    </Focusable>
  );
};