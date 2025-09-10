// hooks/useGameArtwork.tsx
import { useState, useEffect } from "react";
import { getGameArtwork, getSteamGridDBArtwork } from "../services/api";
import { STEAM_CDN_URLS } from "../constants/steam";
import { logger } from "../utils/logger";

export const useGameArtwork = (appId: number | null, skipLocalAndSteamDB: boolean = false) => {
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

    // For tracked games, skip expensive local/SteamGridDB searches - rely on Steam's header_image fallback
    if (skipLocalAndSteamDB) {
      setArtwork(null);
      return;
    }

    const fetchArtwork = async () => {
      try {
        setIsLoading(true);
        
        // First try local Steam artwork
        const localResult = await getGameArtwork(appId);

        // Convert Record<string, string | null> to our expected type
        let artworkData = {
          grid: localResult.grid || null,
          hero: localResult.hero || null,
          logo: localResult.logo || null,
          icon: localResult.icon || null
        };

        // If no local artwork found, try SteamGridDB fallback (local files only)
        const hasAnyLocalArtwork = artworkData.grid || artworkData.hero || artworkData.logo || artworkData.icon;
        
        if (!hasAnyLocalArtwork) {
          try {
            const steamGridDBResult = await getSteamGridDBArtwork(appId);
            artworkData = {
              grid: steamGridDBResult.grid || artworkData.grid,
              hero: steamGridDBResult.hero || artworkData.hero,
              logo: steamGridDBResult.logo || artworkData.logo,
              icon: steamGridDBResult.icon || artworkData.icon
            };
          } catch (steamGridDBError) {
            logger.debug("SteamGridDB fallback failed", steamGridDBError);
            // Continue with local artwork (which may be null)
          }
        }

        // Don't auto-populate with Steam CDN URLs - let getBestImage handle fallbacks

        setArtwork(artworkData);
      } catch (error) {
        logger.error("Failed to fetch game artwork:", error);
        setArtwork(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtwork();
  }, [appId, skipLocalAndSteamDB]);

  // Helper function to get the best available image for banner/header use
  const getBestImage = (fallbackHeaderImage?: string): string | null => {
    // Priority: artwork.hero > artwork.grid > fallback header_image > Steam CDN
    const artworkImage = artwork ? (artwork.hero || artwork.grid) : null;
    
    if (artworkImage) {
      return artworkImage;
    }
    
    if (fallbackHeaderImage) {
      return fallbackHeaderImage;
    }
    
    // Last resort: generate Steam CDN URL if we have app_id
    if (appId) {
      return STEAM_CDN_URLS.HEADER(appId);
    }
    
    return null;
  };

  return {
    artwork,
    isLoading,
    getBestImage
  };
};