// components/tabs/RecentTab.tsx
import { VFC } from "react";
import { 
  PanelSection, 
  PanelSectionRow, 
  ButtonItem, 
  Focusable,
  Navigation
} from "@decky/ui";
import { FaSync, FaStar } from "react-icons/fa";
import { RecentAchievement } from "../../models";
import { formatTime, formatGlobalPercent } from "../../services/formatters";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface RecentTabProps {
  recentAchievements: RecentAchievement[];
  isLoading: boolean;
  onFetchRecent: () => Promise<void>;
}

export const RecentTab: VFC<RecentTabProps> = ({
  recentAchievements,
  isLoading,
  onFetchRecent
}) => {
  const handleNavigateToGame = (gameId: number) => {
    Navigation.NavigateToSteamWeb(`https://store.steampowered.com/app/${gameId}`);
  };


  return (
    <PanelSection title="Recent Achievements">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={onFetchRecent}
          disabled={isLoading}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <FaSync 
              style={{ 
                fontSize: "12px",
                animation: isLoading ? "spin 1s linear infinite" : "none"
              }} 
            />
            Refresh Recent
          </div>
        </ButtonItem>
      </PanelSectionRow>
      
      {recentAchievements.length > 0 ? (
        <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
          <Focusable style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recentAchievements.map((ach, index) => (
              <PanelSectionRow key={`${ach.game_id}_${ach.unlock_time}_${index}`}>
                <ButtonItem
                  layout="below"
                  onClick={() => handleNavigateToGame(ach.game_id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
                    {ach.icon && (
                      <img 
                        src={ach.icon} 
                        style={{ width: "28px", height: "28px", borderRadius: "4px" }}
                        alt=""
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "2px" }}>
                        {ach.achievement_name}
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "1px" }}>
                        {ach.game_name}
                      </div>
                      <div style={{ fontSize: "10px", opacity: 0.6 }}>
                        {formatTime(ach.unlock_time)}
                      </div>
                    </div>
                    {ach.global_percent !== null && !isNaN(ach.global_percent) && ach.global_percent <= 10 && (
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        minWidth: "35px"
                      }}>
                        <FaStar style={{ color: "#FFD700", fontSize: "14px" }} />
                        <div style={{ fontSize: "9px", opacity: 0.8 }}>
                          {formatGlobalPercent(ach.global_percent)}
                        </div>
                      </div>
                    )}
                  </div>
                </ButtonItem>
              </PanelSectionRow>
            ))}
          </Focusable>
        </div>
      ) : (
        <PanelSectionRow>
          <div style={{ opacity: 0.6, textAlign: "center", padding: "15px", fontSize: "14px" }}>
            {isLoading ? (
              <LoadingSpinner message="Loading recent achievements..." size="small" />
            ) : (
              "No recent achievements found"
            )}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );

  
};