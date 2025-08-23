import React, { useEffect, useState } from "react";
import { UICompositionWrapper, UIComposition } from "./UICompositionWrapper";

interface CircularProgressProps {
  current: number;          // Achievements unlocked
  total: number;            // Total achievements
  gameLogo?: string;        // Optional background logo URL
  position?: "right" | "center"; // Overlay position
  visible?: boolean;        // Whether overlay should be visible
}

export const CircularProgressOverlay: React.FC<CircularProgressProps> = ({
  current,
  total,
  gameLogo,
  position = "right",
  visible = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Debug logging
  console.log('CircularProgressOverlay render:', { visible, current, total, position });
  const radius = 60;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // Animate on progress change
  useEffect(() => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    setProgress(percentage);

    // Small pulse every increment
    setPulse(true);
    setTimeout(() => setPulse(false), 500);

    // Big celebration at 100%
    if (percentage >= 100) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);
    }
  }, [current, total]);

  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  // Don't render if not visible
  if (!visible) {
    console.log('CircularProgressOverlay: not visible, returning null');
    return null;
  }

  return (
    <UICompositionWrapper visible={visible} composition={UIComposition.Notification}>
      <div
        style={{
          position: "fixed",
          bottom: "8%",
          right: position === "right" ? "5%" : undefined,
          left: position === "center" ? "50%" : undefined,
          transform: position === "center" ? "translateX(-50%)" : undefined,
          width: "140px",
          height: "140px",
          zIndex: 10000, // Higher z-index as fallback
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
      {/* Faded Background Logo */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: gameLogo
            ? `url(${gameLogo}) center/contain no-repeat`
            : "rgba(255,255,255,0.05)",
          filter: "grayscale(100%) opacity(0.2)",
        }}
      />

      {/* Progress Circle */}
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={progress >= 100 ? "#FFD700" : "#4CAF50"}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            transition: "stroke-dashoffset 0.8s ease-out, stroke 0.5s",
            filter:
              progress >= 100
                ? "drop-shadow(0 0 12px gold)"
                : "drop-shadow(0 0 8px #4CAF50)",
          }}
        />
      </svg>

      {/* Progress Text */}
      <div
        style={{
          position: "absolute",
          color: "white",
          fontSize: "16px",
          fontWeight: "bold",
          textShadow: "0 0 6px rgba(0,0,0,0.8)",
          animation: celebrate
            ? "pulse-celebrate 1.5s ease-out"
            : pulse
            ? "pulse-increment 0.5s ease-out"
            : undefined,
        }}
      >
        {current}/{total}
      </div>

      {/* Sparkles if >=90% */}
      {progress >= 90 && (
        <div className="sparkle-container">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="sparkle" style={{ "--i": i } as any}></div>
          ))}
        </div>
      )}

      <style>
        {`
        @keyframes pulse-increment {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes pulse-celebrate {
          0% { transform: scale(1); filter: drop-shadow(0 0 10px gold);}
          30% { transform: scale(1.3); filter: drop-shadow(0 0 20px gold);}
          60% { transform: scale(1); filter: drop-shadow(0 0 10px gold);}
          100% { transform: scale(1); filter: drop-shadow(0 0 0 gold);}
        }

        .sparkle-container {
          position: absolute;
          width: 140px;
          height: 140px;
          pointer-events: none;
        }

        .sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          animation: orbit 2s linear infinite;
          animation-delay: calc(var(--i) * 0.25s);
          opacity: 0.8;
        }

        @keyframes orbit {
          0% {
            transform: rotate(calc(var(--i) * 45deg)) translate(70px) scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotate(calc(var(--i) * 45deg + 360deg)) translate(70px) scale(0.8);
            opacity: 0;
          }
        }
        `}
      </style>
      </div>
    </UICompositionWrapper>
  );
};