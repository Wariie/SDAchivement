// components/common/TabNavigation.tsx
import { VFC } from "react";
import { PanelSection, DialogButton, Focusable } from "@decky/ui";
import { FaGamepad, FaClock, FaChartLine, FaKey } from "react-icons/fa";
import { Tab, TabNavigationProps } from "../../models";

export const TabNavigation: VFC<TabNavigationProps> = ({ currentTab, onTabChange }) => {
  return (
    <PanelSection>
      <Focusable style={{ display: "flex", gap: "2px" }}>
        <DialogButton
          style={{ 
            flex: 1, 
            padding: "8px",
            minWidth: "40px",
            backgroundColor: currentTab === Tab.CURRENT_GAME ? "rgba(255,255,255,0.1)" : "transparent"
          }}
          onClick={() => onTabChange(Tab.CURRENT_GAME)}
        >
          <FaGamepad size={16} />
        </DialogButton>
        
        <DialogButton
          style={{ 
            flex: 1, 
            padding: "8px",
            minWidth: "40px",
            backgroundColor: currentTab === Tab.RECENT ? "rgba(255,255,255,0.1)" : "transparent"
          }}
          onClick={() => onTabChange(Tab.RECENT)}
        >
          <FaClock size={16} />
        </DialogButton>
        
        <DialogButton
          style={{ 
            flex: 1, 
            padding: "8px",
            minWidth: "40px",
            backgroundColor: currentTab === Tab.OVERALL ? "rgba(255,255,255,0.1)" : "transparent"
          }}
          onClick={() => onTabChange(Tab.OVERALL)}
        >
          <FaChartLine size={16} />
        </DialogButton>
        
        <DialogButton
          style={{ 
            flex: 1, 
            padding: "8px",
            minWidth: "40px",
            backgroundColor: currentTab === Tab.SETTINGS ? "rgba(255,255,255,0.1)" : "transparent"
          }}
          onClick={() => onTabChange(Tab.SETTINGS)}
        >
          <FaKey size={16} />
        </DialogButton>
      </Focusable>
    </PanelSection>
  );
};