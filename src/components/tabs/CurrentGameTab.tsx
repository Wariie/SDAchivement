// components/tabs/CurrentGameTab.tsx
import { VFC, useState, useCallback, useEffect } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, ToggleField, showModal } from "@decky/ui";
import { FaSync, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { GameInfo, AchievementData, SortBy, TrackedGame } from "../../models";
import { GameBanner } from "../game/GameBanner";
import { ProgressDisplay } from "../common/ProgressDisplay";
import { AchievementList } from "../achievements/AchievementList";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { GameSelectionModal } from "../game/GameSelectionModal";
import { getGameInfo } from "../../services/api";

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
  const [viewMode, setViewMode] = useState<"current" | "tracked">("current");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [enhancedTrackedGame, setEnhancedTrackedGame] = useState<GameInfo | null>(null);

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

  // Auto-switch logic - only for initial setup, not when user manually toggles
  useEffect(() => {
    // Only auto-switch to tracked if no current game and we have a tracked game (initial setup)
    if (!currentGame && trackedGame && viewMode === "current") {
      setViewMode("tracked");
    }
  }, [currentGame, trackedGame]); // Removed viewMode from dependencies to prevent loops

  // Fetch enhanced tracked game info (with header_image)
  useEffect(() => {
    const fetchTrackedGameInfo = async () => {
      if (trackedGame && trackedGame.app_id) {
        try {
          console.log("Fetching enhanced info for tracked game:", trackedGame.app_id);
          const gameInfo = await getGameInfo(trackedGame.app_id);
          if (gameInfo) {
            // Create enhanced game object with header_image
            const enhanced = {
              ...gameInfo,
              app_id: trackedGame.app_id,
              name: trackedGame.name, // Keep the tracked name
              is_running: false // Tracked games aren't necessarily running
            };
            setEnhancedTrackedGame(enhanced);
            console.log("Enhanced tracked game info loaded:", enhanced);
          }
        } catch (error) {
          console.error("Failed to fetch tracked game info:", error);
          setEnhancedTrackedGame(null);
        }
      } else {
        setEnhancedTrackedGame(null);
      }
    };

    fetchTrackedGameInfo();
  }, [trackedGame]);

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
    (enhancedTrackedGame || (trackedGame ? { ...trackedGame, is_running: false, has_achievements: true } as GameInfo : null));
  const displayAchievements = viewMode === "current" ? achievements : trackedGameAchievements;

  return (
    <div style={{ padding: "0", margin: "0" }}>
      {/* Game Banner */}
      <GameBanner 
        game={displayGame}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        trackedGame={trackedGame}
        installedGames={installedGames}
        onSetTrackedGame={onSetTrackedGame}
        onClearTrackedGame={onClearTrackedGame}
        onSelectTrackedGame={handleSelectTrackedGame}
        viewMode={viewMode}
        currentGame={currentGame}
        onViewModeChange={setViewMode}
      />


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

      {/* Collapsible Filters and Sort */}
      {displayAchievements && !displayAchievements.error && displayAchievements.total > 0 && (
        <PanelSection>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "14px",
                width: "100%"
              }}>
                <span style={{ fontWeight: "500" }}>
                  Filters & Sort
                </span>
                {filtersExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </ButtonItem>
          </PanelSectionRow>
          
          {filtersExpanded && (
            <>
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
            </>
          )}
        </PanelSection>
      )}

      {/* Achievement List */}
      {displayAchievements && !displayAchievements.error && displayAchievements.total > 0 && (
        <PanelSection title="Achievements">
          <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
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
      {isLoading && loadingMessage && loadingMessage.trim() && (
        <PanelSection>
          <PanelSectionRow>
            <LoadingSpinner message={loadingMessage} size="small" />
          </PanelSectionRow>
        </PanelSection>
      )}
      
    </div>
  );
};