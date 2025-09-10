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

  // Get the best image source - trust getBestImage to handle all fallbacks
  const imageSrc = hasError ? null : getBestImage(headerImage);

  const handleError = (_e: React.SyntheticEvent<HTMLImageElement>) => {
    // If image fails to load, show fallback or hide
    setHasError(true);
    onError?.();
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
        src={imageSrc}
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