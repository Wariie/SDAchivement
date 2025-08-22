// services/formatters.ts
import { Achievement } from "../models";

export function formatGlobalPercent(percent: any): string {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return "N/A";
  }
  return `${Number(percent).toFixed(1)}%`;
}

export function calculateProgress(unlocked: any, total: any): number {
  const unlockedNum = Number(unlocked) || 0;
  const totalNum = Number(total) || 0;
  
  if (totalNum === 0) {
    return 0;
  }
  
  const progress = Math.round(unlockedNum / totalNum * 100);
  return progress;
}

export function formatProgressText(unlocked: any, total: any, showPercentage = false): string {
  const unlockedNum = Number(unlocked) || 0;
  const totalNum = Number(total) || 0;
  
  if (showPercentage) {
    const percentage = totalNum > 0 ? Math.round((unlockedNum / totalNum) * 100) : 0;
    return `${unlockedNum} / ${totalNum} achievements (${percentage}%)`;
  }
  
  return `${unlockedNum} / ${totalNum} achievements`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export function getRarestAchievement(achievements?: Achievement[]): Achievement | null {
  if (!achievements || achievements.length === 0) return null;
  return achievements.reduce((prev, curr) => {
    if (
      curr.global_percent !== null &&
      !isNaN(curr.global_percent) &&
      (prev.global_percent === null || curr.global_percent < prev.global_percent)
    ) {
      return curr;
    }
    return prev;
  });
}

export function getMilestoneInfo(achievementCount: number): { title: string; description: string; next: string } {
  if (achievementCount >= 10000) {
    return {
      title: "🏅 Legendary Hunter",
      description: `${achievementCount.toLocaleString()} achievements!`,
      next: "You're a legend!"
    };
  } else if (achievementCount >= 5000) {
    return {
      title: "💎 Master Collector",
      description: `${achievementCount.toLocaleString()} achievements!`,
      next: `${10000 - achievementCount} to reach 10,000`
    };
  } else if (achievementCount >= 1000) {
    return {
      title: "⭐ Achievement Expert",
      description: `${achievementCount.toLocaleString()} achievements!`,
      next: `${5000 - achievementCount} to reach 5,000`
    };
  } else if (achievementCount >= 500) {
    return {
      title: "🌟 Rising Star",
      description: `${achievementCount.toLocaleString()} achievements!`,
      next: `${1000 - achievementCount} to reach 1,000`
    };
  } else if (achievementCount >= 100) {
    return {
      title: "✨ Getting Started",
      description: `${achievementCount.toLocaleString()} achievements!`,
      next: `${500 - achievementCount} to reach 500`
    };
  } else {
    return {
      title: "🌱 Beginner",
      description: "Keep going!",
      next: `${100 - achievementCount} to reach 100`
    };
  }
}