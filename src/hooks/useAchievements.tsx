// hooks/useAchievements.tsx
import { useState, useCallback } from "react";
import { toaster } from "@decky/api";
import {
  getAchievements,
  getRecentAchievements,
  getAchievementProgress,
  getRecentlyPlayedGames,
  refreshCache
} from "../services/api";
import {
  AchievementData,
  RecentAchievement,
  OverallProgress,
  GameInfo
} from "../models";

export interface UseAchievementsReturn {
  // State
  achievements: AchievementData | null;
  recentAchievements: RecentAchievement[];
  recentlyPlayedGames: GameInfo[];
  overallProgress: OverallProgress | null;
  isLoading: boolean;
  loadingMessage: string;

  // Actions
  fetchAchievements: (appId?: number) => Promise<void>;
  fetchRecentAchievements: () => Promise<void>;
  fetchRecentlyPlayedGames: () => Promise<void>;
  fetchOverallProgress: () => Promise<void>;
  handleRefresh: (appId?: number) => Promise<void>;
  clearAchievements: () => void;
}

export const useAchievements = (): UseAchievementsReturn => {
  const [achievements, setAchievements] = useState<AchievementData | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [recentlyPlayedGames, setRecentlyPlayedGames] = useState<GameInfo[]>([]);
  const [overallProgress, setOverallProgress] = useState<OverallProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const fetchAchievements = useCallback(async (appId?: number) => {
    setIsLoading(true);
    setLoadingMessage("Loading achievements...");
    try {
      const result = await getAchievements(appId);
      if (result && !result.error) {
        setAchievements(result);
      } else if (result?.error) {
        toaster.toast({
          title: "Achievement Error",
          body: result.error,
          critical: true
        });
        setAchievements(null);
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to fetch achievements",
        critical: true
      });
      setAchievements(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  const fetchRecentAchievements = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage("Loading recent achievements...");
    try {
      const result = await getRecentAchievements(20);
      if (result) {
        setRecentAchievements(result);
      }
    } catch (error) {
      console.error("Failed to fetch recent achievements:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to fetch recent achievements",
        critical: true
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  const fetchRecentlyPlayedGames = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage("Loading recently played games...");
    try {
      const result = await getRecentlyPlayedGames(5);
      if (result) {
        setRecentlyPlayedGames(result);
      }
    } catch (error) {
      console.error("Failed to fetch recently played games:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to fetch recently played games",
        critical: true
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  const fetchOverallProgress = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage("Calculating overall progress...");
    try {
      const result = await getAchievementProgress();
      if (result && !result.error) {
        setOverallProgress(result);
      } else if (result?.error) {
        toaster.toast({
          title: "Error",
          body: result.error,
          critical: true
        });
      }
    } catch (error) {
      console.error("Failed to fetch overall progress:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to fetch overall progress",
        critical: true
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  const handleRefresh = useCallback(async (appId?: number) => {
    try {
      await refreshCache(appId);
      if (appId) {
        await fetchAchievements(appId);
      }
      toaster.toast({
        title: "Refreshed",
        body: "Achievement data updated"
      });
    } catch (error) {
      console.error("Failed to refresh:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to refresh data",
        critical: true
      });
    }
  }, [fetchAchievements]);

  const clearAchievements = useCallback(() => {
    setAchievements(null);
    setRecentAchievements([]);
    setRecentlyPlayedGames([]);
    setOverallProgress(null);
  }, []);

  return {
    // State
    achievements,
    recentAchievements,
    recentlyPlayedGames,
    overallProgress,
    isLoading,
    loadingMessage,

    // Actions
    fetchAchievements,
    fetchRecentAchievements,
    fetchRecentlyPlayedGames,
    fetchOverallProgress,
    handleRefresh,
    clearAchievements
  };
};