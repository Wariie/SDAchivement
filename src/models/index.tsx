// types/index.ts

export interface Achievement {
  api_name: string;
  display_name: string;
  description: string;
  icon: string;
  icon_gray: string;
  hidden: boolean;
  unlocked: boolean;
  unlock_time: number | null;
  global_percent: number | null;
}

export interface AchievementData {
  app_id: number;
  total: number;
  unlocked: number;
  percentage: number;
  achievements: Achievement[];
  error?: string;
}

export interface GameStats {
  app_id: number;
  stats: Record<string, number>;
  error?: string;
}

export interface TrackedGame {
  app_id: number;
  name: string;
  last_checked?: number;
}

export interface RecentAchievement {
  game_name: string;
  game_id: number;
  achievement_name: string;
  achievement_desc: string;
  unlock_time: number;
  icon: string;
  global_percent: number;
}

// GameInfo type extended with playtime (in minutes)
export interface GameInfo {
  app_id: number;
  name: string;
  is_running: boolean;
  has_achievements: boolean;
  achievements: number;
  header_image?: string;
  playtime_forever?: number; // Total playtime in minutes
}

export interface OverallProgress {
  total_games: number;
  games_with_achievements: number;
  total_achievements: number;
  unlocked_achievements: number;
  average_completion: number;
  perfect_games: Array<GameInfo>;
  perfect_games_count: number;
  error?: string;
}

// Tab enums
export enum Tab {
  CURRENT_GAME = "current",
  RECENT = "recent",
  OVERALL = "overall",
  SETTINGS = "settings"
}


export type SortBy = "name" | "unlock" | "rarity";

// Component props interfaces
export interface AchievementItemProps {
  achievement: Achievement;
}

export interface AchievementListProps {
  achievements: Achievement[];
  sortBy: SortBy;
  showHidden: boolean;
  filterRarity: number;
  showUnlockedOnly?: boolean;
  showLockedOnly?: boolean;
  isLoading?: boolean;
}

export interface GameBannerProps {
  game: GameInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
  // Tracking functionality
  trackedGame?: TrackedGame | null;
  installedGames?: GameInfo[];
  onSetTrackedGame?: (game: TrackedGame) => Promise<void>;
  onClearTrackedGame?: () => Promise<void>;
  onSelectTrackedGame?: () => void;
  viewMode?: "current" | "tracked";
  // View mode toggle
  currentGame?: GameInfo | null;
  onViewModeChange?: (mode: "current" | "tracked") => void;
}

export interface TabNavigationProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export interface ProgressDisplayProps {
  unlocked: number;
  total: number;
  showPercentage?: boolean;
}

export interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

// Settings related types
export interface PluginSettings {
  steam_api_key?: string;
  steam_user_id?: string;
  auto_refresh: boolean;
  refresh_interval: number;
  test_app_id?: number;
  tracked_game?: TrackedGame;
  api_key_set?: boolean;
  error?: string;
}