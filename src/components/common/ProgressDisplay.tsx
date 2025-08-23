// components/common/ProgressDisplay.tsx
import { VFC } from "react";
import { ProgressBarWithInfo } from "@decky/ui";
import { ProgressDisplayProps } from "../../models";
import { calculateProgress, formatProgressText } from "../../services/formatters";

export const ProgressDisplay: VFC<ProgressDisplayProps> = ({ 
  unlocked, 
  total, 
  showPercentage = false 
}) => {
  return (
    <>
      <ProgressBarWithInfo
        nProgress={calculateProgress(unlocked, total)}
        sOperationText={formatProgressText(unlocked, total, showPercentage)}
        nTransitionSec={0.3}
      />
      
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        fontSize: "12px",
        marginTop: "4px"
      }}>
        <span>{calculateProgress(unlocked, total)}% complete</span>
        <span>{(Number(total) || 0) - (Number(unlocked) || 0)} remaining</span>
      </div>
    </>
  );
};