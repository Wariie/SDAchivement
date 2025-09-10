// services/formatters.ts
export function formatGlobalPercent(percent: number | null): string {
  return percent != null ? `${percent.toFixed(1)}%` : "N/A";
}

export function calculateProgress(unlocked: number, total: number): number {
  return total > 0 ? Math.round((unlocked / total) * 100) : 0;
}

export function formatProgressText(unlocked: number, total: number, showPercentage = false): string {
  const percentage = showPercentage && total > 0 ? ` (${Math.round((unlocked / total) * 100)}%)` : '';
  return `${unlocked} / ${total} achievements${percentage}`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export function formatPlaytime(minutes?: number): string {
  if (!minutes || minutes === 0) return "0 minutes";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${minutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hours`;
  return `${hours}h ${remainingMinutes}m`;
}


export function getRarityInfo(globalPercent: number) {
  if (globalPercent <= 1) return { color: "#E91E63", text: "Very Rare" };
  if (globalPercent <= 5) return { color: "#FF9800", text: "Rare" };
  if (globalPercent <= 10) return { color: "#2196F3", text: "Uncommon" };
  if (globalPercent <= 25) return { color: "#4CAF50", text: "Common" };
  return { color: "#9E9E9E", text: "Common" };
}

export function convertRecentToAchievement(recent: { achievement_name: string; achievement_desc: string; icon: string; unlock_time: number; global_percent: number }) {
  return {
    api_name: recent.achievement_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    display_name: recent.achievement_name,
    description: recent.achievement_desc,
    icon: recent.icon,
    icon_gray: recent.icon,
    hidden: false,
    unlocked: true,
    unlock_time: recent.unlock_time,
    global_percent: recent.global_percent
  };
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