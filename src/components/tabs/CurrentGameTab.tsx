// components/tabs/CurrentGameTab.tsx
import { VFC, useState, useCallback } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, ToggleField, DialogButton, showModal } from "@decky/ui";
import { FaSync, FaEye, FaGamepad } from "react-icons/fa";
import { GameInfo, AchievementData, SortBy, TrackedGame } from "../../models";
import { GameBanner } from "../game/GameBanner";
import { ProgressDisplay } from "../common/ProgressDisplay";
import { AchievementList } from "../achievements/AchievementList";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { GameSelectionModal } from "../game/GameSelectionModal";

interface CurrentGameTabProps {
  currentGame: GameInfo | null;
  achievements: AchievementData | null;
  trackedGame: TrackedGame | null;
  trackedGameAchievements: AchievementData | null;
  installedGames: GameInfo[];
  isLoading: boolean;
  loadingMessage: string;
  onRefreshGame: () => Promise<GameInfo | null>;
  onRefreshAchievements: () => Promise<void>;
  onSetTrackedGame: (game: TrackedGame) => Promise<void>;
  onClearTrackedGame: () => Promise<void>;
  onFetchTrackedAchievements: () => Promise<void>;
}

export const CurrentGameTab: VFC<CurrentGameTabProps> = ({
  currentGame,
  achievements,
  trackedGame,
  trackedGameAchievements,
  installedGames,
  isLoading,
  loadingMessage,
  onRefreshGame,
  onRefreshAchievements,
  onSetTrackedGame,
  onClearTrackedGame,
  onFetchTrackedAchievements
}) => {
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("unlock");
  const [filterRarity, setFilterRarity] = useState(0);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"current" | "tracked">(currentGame ? "current" : "tracked");

  const handleRefresh = async () => {
    if (viewMode === "current") {
      await onRefreshGame();
      if (currentGame) {
        await onRefreshAchievements();
      }
    } else {
      // Refresh tracked game achievements
      await onFetchTrackedAchievements();
    }
  };

  const handleSelectTrackedGame = useCallback(() => {
    if (installedGames.length === 0) {
      alert("No installed games found. Please make sure you have games installed on your Steam Deck.");
      return;
    }

    let modalInstance: any = null;
    
    modalInstance = showModal(
      <GameSelectionModal
        games={installedGames}
        onSelect={async (game) => {
          await onSetTrackedGame({
            app_id: game.app_id,
            name: game.name
          });
          modalInstance?.Close();
        }}
        closeModal={() => {
          modalInstance?.Close();
        }}
      />
    );
  }, [installedGames, onSetTrackedGame]);

  // Auto-switch to current game when one starts running
  if (currentGame && viewMode === "tracked") {
    setViewMode("current");
  }
  
  // Auto-switch to tracked if no current game and we have a tracked game
  if (!currentGame && trackedGame && viewMode === "current") {
    setViewMode("tracked");
  }

  const getSortDisplayName = (sort: SortBy): string => {
    switch (sort) {
      case "unlock": return "Recently Unlocked";
      case "name": return "Name";
      case "rarity": return "Rarity";
      default: return "Recently Unlocked";
    }
  };

  const getRarityDisplayName = (rarity: number): string => {
    switch (rarity) {
      case 0: return "All";
      case 1: return "Very Rare (≤1%)";
      case 5: return "Rare (≤5%)";
      case 10: return "Uncommon (≤10%)";
      case 25: return "Common (≤25%)";
      default: return "All";
    }
  };

  const cycleSortBy = () => {
    const sorts: SortBy[] = ["unlock", "name", "rarity"];
    const currentIndex = sorts.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sorts.length;
    setSortBy(sorts[nextIndex]);
  };

  const cycleFilterRarity = () => {
    const rarities = [0, 1, 5, 10, 25];
    const currentIndex = rarities.indexOf(filterRarity);
    const nextIndex = (currentIndex + 1) % rarities.length;
    setFilterRarity(rarities[nextIndex]);
  };

  // Determine which game and achievements to display
  const displayGame = viewMode === "current" ? currentGame : 
    (trackedGame ? { ...trackedGame, is_running: false, has_achievements: true } as GameInfo : null);
  const displayAchievements = viewMode === "current" ? achievements : trackedGameAchievements;

  return (
    <div style={{ padding: "0", margin: "0" }}>
      {/* View Toggle - show when we have both options */}
      {(currentGame || trackedGame) && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ display: "flex", gap: "4px" }}>
              {currentGame && (
                <DialogButton
                  style={{ 
                    flex: 1,
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: viewMode === "current" ? "rgba(255,255,255,0.15)" : "transparent"
                  }}
                  onClick={() => setViewMode("current")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <FaGamepad size={12} />
                    <span>Current Game</span>
                  </div>
                </DialogButton>
              )}
              {trackedGame && (
                <DialogButton
                  style={{ 
                    flex: 1,
                    fontSize: "12px",
                    padding: "8px",
                    backgroundColor: viewMode === "tracked" ? "rgba(255,255,255,0.15)" : "transparent"
                  }}
                  onClick={() => setViewMode("tracked")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <FaEye size={12} />
                    <span>Tracked Game</span>
                  </div>
                </DialogButton>
              )}
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Game Banner */}
      <GameBanner 
        game={displayGame}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* No Game / Tracked Game Selection */}
      {!displayGame && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ textAlign: "center", opacity: 0.6, padding: "20px", fontSize: "14px" }}>
              {viewMode === "current" ? "No game currently running" : "No game selected for tracking"}
            </div>
          </PanelSectionRow>
          {viewMode === "tracked" && (
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={handleSelectTrackedGame}
              >
                <div style={{ fontSize: "14px" }}>
                  Select Game to Track
                </div>
              </ButtonItem>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}

      {/* Tracked Game Management */}
      {viewMode === "tracked" && trackedGame && (
        <PanelSection>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleSelectTrackedGame}
            >
              <div style={{ fontSize: "14px" }}>
                Change Tracked Game
              </div>
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={onClearTrackedGame}
            >
              <div style={{ fontSize: "14px" }}>
                Clear Tracked Game
              </div>
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Achievement Progress */}
      {displayAchievements && !displayAchievements.error && (
        <PanelSection title="Progress">
          <PanelSectionRow>
            <ProgressDisplay
              unlocked={displayAchievements.unlocked}
              total={displayAchievements.total}
            />
          </PanelSectionRow>
        </PanelSection>
      )}

      {/* Filters and Sort */}
      {displayAchievements && !displayAchievements.error && displayAchievements.total > 0 && (
        <PanelSection title="Filters">
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={cycleSortBy}
            >
              <div style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Sort: {getSortDisplayName(sortBy)}</span>
                <span style={{ fontSize: "12px", opacity: 0.6 }}>→</span>
              </div>
            </ButtonItem>
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={cycleFilterRarity}
            >
              <div style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Rarity: {getRarityDisplayName(filterRarity)}</span>
                <span style={{ fontSize: "12px", opacity: 0.6 }}>→</span>
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
            <ToggleField
              label="Unlocked only"
              checked={showUnlockedOnly}
              onChange={(value) => {
                setShowUnlockedOnly(value);
                if (value) setShowLockedOnly(false);
              }}
            />
          </PanelSectionRow>
          
          <PanelSectionRow>
            <ToggleField
              label="Locked only"
              checked={showLockedOnly}
              onChange={(value) => {
                setShowLockedOnly(value);
                if (value) setShowUnlockedOnly(false);
              }}
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
      {displayAchievements && !displayAchievements.error && displayAchievements.total > 0 && (
        <PanelSection title="Achievements">
          <div style={{ maxHeight: "350px", overflowY: "auto", overflowX: "hidden" }}>
            <AchievementList
              achievements={displayAchievements.achievements}
              sortBy={sortBy}
              showHidden={showHidden}
              filterRarity={filterRarity}
              showUnlockedOnly={showUnlockedOnly}
              showLockedOnly={showLockedOnly}
              isLoading={isLoading}
            />
          </div>
        </PanelSection>
      )}
      
      {/* Error message */}
      {displayAchievements?.error && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ color: "#ff6b6b", fontSize: "14px", padding: "8px" }}>
              {displayAchievements.error}
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