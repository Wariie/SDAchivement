// components/tabs/CurrentGameTab.tsx
import { VFC, useState, useCallback, useEffect } from "react";
import { PanelSection, PanelSectionRow, ButtonItem, ToggleField, showModal } from "@decky/ui";
import { FaSync, FaChevronDown, FaChevronUp } from "../../utils/icons";
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterRarity, setFilterRarity] = useState(0);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"current" | "tracked">("current");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [enhancedTrackedGame, setEnhancedTrackedGame] = useState<GameInfo | null>(null);

  // Determine which game and achievements to display
  const displayGame = viewMode === "current" ? currentGame : 
    (enhancedTrackedGame || (trackedGame ? { ...trackedGame, is_running: false, has_achievements: true } as GameInfo : null));
  const displayAchievements = viewMode === "current" ? achievements : trackedGameAchievements;

  const handleRefresh = async () => {
    if (viewMode === "current" || !displayGame) {
      // Always try to refresh current game if we're in current mode or have no display game
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

  // Auto-switch back to current mode when tracked game is cleared
  useEffect(() => {
    // If we're in tracked mode but there's no tracked game, switch back to current mode
    if (viewMode === "tracked" && !trackedGame) {
      setViewMode("current");
    }
  }, [trackedGame, viewMode]);

  // Fetch enhanced tracked game info (with header_image)
  useEffect(() => {
    const fetchTrackedGameInfo = async () => {
      if (trackedGame && trackedGame.app_id) {
        try {
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
          }
        } catch (error) {
          console.error("Failed to fetch tracked game info:", error);
          setEnhancedTrackedGame(null);
        }
      } else {
        // Clear enhanced tracked game when there's no tracked game
        setEnhancedTrackedGame(null);
      }
    };

    fetchTrackedGameInfo();
  }, [trackedGame]);

  const getSortDisplayName = (sort: SortBy, order: "asc" | "desc"): string => {
    const orderText = order === "asc" ? " (Ascending)" : " (Descending)";
    switch (sort) {
      case "unlock": 
        return order === "desc" ? "Recently Unlocked" : "Oldest Unlocked";
      case "name": 
        return "Name" + orderText;
      case "rarity": 
        return "Rarity" + orderText;
      default: 
        return "Recently Unlocked";
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

  const cycleSortOption = () => {
    // Define all sort combinations in the desired order
    const sortOptions: Array<{sort: SortBy, order: "asc" | "desc"}> = [
      { sort: "unlock", order: "desc" }, // Recently Unlocked
      { sort: "unlock", order: "asc" },  // Oldest Unlocked
      { sort: "name", order: "asc" },    // Name (Ascending)
      { sort: "name", order: "desc" },   // Name (Descending)
      { sort: "rarity", order: "asc" },  // Rarity (Ascending)
      { sort: "rarity", order: "desc" }  // Rarity (Descending)
    ];
    
    // Find current combination
    const currentIndex = sortOptions.findIndex(
      option => option.sort === sortBy && option.order === sortOrder
    );
    
    // Move to next option (or back to first if at end)
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    const nextOption = sortOptions[nextIndex];
    
    setSortBy(nextOption.sort);
    setSortOrder(nextOption.order);
  };

  const cycleFilterRarity = () => {
    const rarities = [0, 1, 5, 10, 25];
    const currentIndex = rarities.indexOf(filterRarity);
    const nextIndex = (currentIndex + 1) % rarities.length;
    setFilterRarity(rarities[nextIndex]);
  };

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
                  onClick={cycleSortOption}
                >
                  <div style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Sort: {getSortDisplayName(sortBy, sortOrder)}</span>
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
              sortOrder={sortOrder}
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