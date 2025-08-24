import React, { useState } from "react";
import { useGameArtwork } from "../../hooks/useGameArtwork";

interface GameImageProps {
  appId: number;
  headerImage?: string;
  alt?: string;
  style?: React.CSSProperties;
  fallbackIcon?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const GameImage: React.VFC<GameImageProps> = ({
  appId,
  headerImage,
  alt = "",
  style,
  fallbackIcon,
  onLoad,
  onError
}) => {
  const { getBestImage } = useGameArtwork(appId);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Determine the best image source to use
  const getImageSrc = (): string | null => {
    if (hasError) return null;
    
    // Priority order: getBestImage result > headerImage prop > Steam CDN fallback
    const bestImage = getBestImage(headerImage);
    if (bestImage) return bestImage;
    
    if (headerImage) return headerImage;
    
    // Steam CDN fallback
    if (appId) return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
    
    return null;
  };

  const imageSrc = getImageSrc();

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const currentImageSrc = e.currentTarget.src;
    const steamCdnUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
    
    // If we haven't tried the Steam CDN fallback yet, try it
    if (currentImageSrc !== steamCdnUrl && appId) {
      setCurrentSrc(steamCdnUrl);
      e.currentTarget.src = steamCdnUrl;
    } else {
      // All sources failed, show fallback or hide
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  // If we have an error and no fallback icon, don't render anything
  if (hasError && !fallbackIcon) {
    return null;
  }

  // If we have an error but have a fallback icon, show it
  if (hasError && fallbackIcon) {
    return <div style={style}>{fallbackIcon}</div>;
  }

  // If we have a valid image source, render the image
  if (imageSrc) {
    return (
      <img
        src={currentSrc || imageSrc}
        alt={alt}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  // No valid source and no fallback, render fallback icon or nothing
  return fallbackIcon ? <div style={style}>{fallbackIcon}</div> : null;
};