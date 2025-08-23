// components/achievements/AchievementList.tsx
import { VFC, useMemo } from "react";
import { AchievementListProps, Achievement } from "../../models";
import { AchievementItem } from "./AchievementItem";
import { AchievementDetailsModal } from "./AchievementDetailsModal";
import { showModal } from "@decky/ui";
import { LoadingSpinner } from "../common/LoadingSpinner";

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

  // Loading is handled by parent component, no need for duplicate spinner
  if (isLoading) {
    return <LoadingSpinner message="Loading achievements..." size="small" />;
    // Let parent handle loading display
  }

  if (!sortedAchievements.length) {
    // Only show message if we have achievements but they're filtered out
    const hasAchievements = achievements && achievements.length > 0;
    if (!hasAchievements) {
      return null; // Don't show anything if no achievements at all
    }
    
    return (
      <div style={{ 
        textAlign: "center", 
        opacity: 0.6, 
        padding: "12px 8px",
        fontSize: "12px"
      }}>
        No achievements match current filters
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "1px", 
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
    </div>
  );
};