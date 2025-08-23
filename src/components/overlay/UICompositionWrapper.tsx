import React from "react";
import { useUIComposition, UIComposition } from "../../hooks/useUIComposition";

// Re-export UIComposition for convenience
export { UIComposition };

interface UICompositionWrapperProps {
  visible: boolean;
  composition?: UIComposition;
  children: React.ReactNode;
}

// This wrapper component manages UI composition lifecycle
// It conditionally renders children with UI composition when visible
export const UICompositionWrapper: React.FC<UICompositionWrapperProps> = ({
  visible,
  composition = UIComposition.Notification,
  children
}) => {
  console.log('UICompositionWrapper:', { visible, composition });
  
  // Only render the inner component when visible
  // This ensures UI composition is only active when needed
  if (!visible) {
    console.log('UICompositionWrapper: not visible, returning null');
    return null;
  }

  return <UICompositionContainer composition={composition}>{children}</UICompositionContainer>;
};

// Internal component that actually uses the UI composition hook
const UICompositionContainer: React.FC<{ 
  composition: UIComposition; 
  children: React.ReactNode;
}> = ({ composition, children }) => {
  console.log('UICompositionContainer: attempting to use UI composition hook with composition:', composition);
  
  try {
    // Use the UI composition hook to display on top of games
    // Don't store the result, just call it like in the working example
    useUIComposition(composition);
    console.log('UIComposition hook called successfully');
  } catch (error) {
    console.error('UIComposition hook failed:', error);
  }

  return <>{children}</>;
};