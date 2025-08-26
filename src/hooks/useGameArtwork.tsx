// hooks/useGameArtwork.tsx
import { useState, useEffect } from "react";
import { getGameArtwork } from "../services/api";

export const useGameArtwork = (appId: number | null) => {
  const [artwork, setArtwork] = useState<{
    grid: string | null;
    hero: string | null;
    logo: string | null;
    icon: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!appId) {
      setArtwork(null);
      return;
    }

    const fetchArtwork = async () => {
      try {
        setIsLoading(true);
        const result = await getGameArtwork(appId);

        // Convert Record<string, string | null> to our expected type
        const artworkData = {
          grid: result.grid || null,
          hero: result.hero || null,
          logo: result.logo || null,
          icon: result.icon || null
        };

        setArtwork(artworkData);
      } catch (error) {
        console.error("Failed to fetch game artwork:", error);
        setArtwork(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtwork();
  }, [appId]);

  // Helper function to get the best available image for banner/header use
  const getBestImage = (fallbackHeaderImage?: string): string | null => {
    if (!artwork) return fallbackHeaderImage || null;

    // Priority: hero > grid > fallback header_image
    return artwork.hero || artwork.grid || fallbackHeaderImage || null;
  };

  return {
    artwork,
    isLoading,
    getBestImage
  };
};