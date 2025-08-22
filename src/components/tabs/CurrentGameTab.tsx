// components/tabs/CurrentGameTab.tsx
import { VFC, useState } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, ToggleField, Menu, MenuItem, showContextMenu } from "@decky/ui";
import { FaSync } from "react-icons/fa";
import { GameInfo, AchievementData, SortBy } from "../../models";
import { GameBanner } from "../game/GameBanner";
import { ProgressDisplay } from "../common/ProgressDisplay";
import { AchievementList } from "../achievements/AchievementList";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface CurrentGameTabProps {
  currentGame: GameInfo | null;
  achievements: AchievementData | null;
  isLoading: boolean;
  loadingMessage: string;
  onRefreshGame: () => Promise<GameInfo | null>;
  onRefreshAchievements: () => Promise<void>;
}

export const CurrentGameTab: VFC<CurrentGameTabProps> = ({
  currentGame,
  achievements,
  isLoading,
  loadingMessage,
  onRefreshGame,
  onRefreshAchievements
}) => {
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("unlock");
  const [filterRarity] = useState(0);

  const handleRefresh = async () => {
    const refreshedGame = await onRefreshGame();
    if (currentGame) {
      await onRefreshAchievements();
    }
  };

  const getSortDisplayName = (sort: SortBy): string => {
    switch (sort) {
      case "unlock": return "Recently Unlocked";
      case "name": return "Name";
      case "rarity": return "Rarity";
      default: return "Recently Unlocked";
    }
  };

  return (
    <div style={{ padding: "0", margin: "0" }}>
      {/* Game Banner */}
      <GameBanner 
        game={currentGame}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Achievement Progress */}
      {achievements && !achievements.error && (
        <PanelSection title="Progress">
          <PanelSectionRow>
            <ProgressDisplay
              unlocked={achievements.unlocked}
              total={achievements.total}
            />
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Filters and Sort */}
      {achievements && !achievements.error && achievements.total > 0 && (
        <PanelSection title="Filters">
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => {
                showContextMenu(
                  <Menu label="Sort By">
                    <MenuItem onClick={() => setSortBy("unlock")}>
                      Recently Unlocked
                    </MenuItem>
                    <MenuItem onClick={() => setSortBy("name")}>
                      Name
                    </MenuItem>
                    <MenuItem onClick={() => setSortBy("rarity")}>
                      Rarity
                    </MenuItem>
                  </Menu>
                );
              }}
            >
              <div style={{ fontSize: "14px" }}>
                Sort: {getSortDisplayName(sortBy)}
              </div>
            </ButtonItem>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ToggleField
              label="Show hidden achievements"
              checked={showHidden}
              onChange={setShowHidden}
            />
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={onRefreshAchievements}
              disabled={isLoading}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <FaSync 
                  style={{ 
                    fontSize: "12px",
                    animation: isLoading ? "spin 1s linear infinite" : "none"
                  }} 
                />
                Refresh
              </div>
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Achievement List */}
      {achievements && !achievements.error && achievements.total > 0 && (
        <PanelSection title="Achievements">
          <div 
            style={{ 
              maxHeight: "350px", 
              overflowY: "auto",
              overflowX: "hidden"
            }}
          >
            <AchievementList
              achievements={achievements.achievements}
              sortBy={sortBy}
              showHidden={showHidden}
              filterRarity={filterRarity}
              isLoading={isLoading}
            />
          </div>
        </PanelSection>
      )}
      
      {/* Error message */}
      {achievements?.error && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ color: "#ff6b6b", fontSize: "14px", padding: "8px" }}>
              {achievements.error}
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <PanelSection>
          <PanelSectionRow>
            <LoadingSpinner message={loadingMessage} size="small" />
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
};