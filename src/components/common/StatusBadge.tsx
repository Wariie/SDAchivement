import React from "react";

interface StatusBadgeProps {
  type: "perfect" | "recent" | "test" | "tracked" | "current";
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const badgeColors = {
  perfect: { bg: "#FFD700", color: "#000" },
  recent: { bg: "#2196F3", color: "white" },
  test: { bg: "#ff6b6b", color: "white" },
  tracked: { bg: "#2196F3", color: "white" },
  current: { bg: "#4CAF50", color: "white" }
};

export const StatusBadge: React.VFC<StatusBadgeProps> = ({ type, children, style }) => {
  const colors = badgeColors[type];

  return (
    <span style={{
      backgroundColor: colors.bg,
      color: colors.color,
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "10px",
      fontWeight: "bold",
      marginLeft: "8px",
      ...style
    }}>
      {children}
    </span>
  );
};