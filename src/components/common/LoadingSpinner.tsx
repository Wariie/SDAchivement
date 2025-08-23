// components/common/LoadingSpinner.tsx
import { VFC, useEffect } from "react";
import { FaSync } from "react-icons/fa";
import { LoadingSpinnerProps } from "../../models";

export const LoadingSpinner: VFC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  size = "medium" 
}) => {
  const sizeMap = {
    small: "16px",
    medium: "24px", 
    large: "32px"
  };

  // Inject spinning animation once
  useEffect(() => {
    if (!document.getElementById('spinning-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spinning-keyframes';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={{ 
      textAlign: "center", 
      opacity: 0.6,
      padding: size === "large" ? "20px" : "10px"
    }}>
      <FaSync 
        style={{ 
          fontSize: sizeMap[size], 
          marginBottom: "8px",
          animation: "spin 1s linear infinite"
        }} 
      />
      <div style={{ fontSize: size === "small" ? "11px" : "13px" }}>
        {message}
      </div>
    </div>
  );
};