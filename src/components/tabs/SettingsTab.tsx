// components/tabs/SettingsTab.tsx
import { VFC, useCallback } from "react";
import { 
  PanelSection, 
  PanelSectionRow, 
  ButtonItem, 
  TextField, 
  ToggleField,
  Menu,
  MenuItem,
  showContextMenu,
  showModal
} from "@decky/ui";
import { FaKey, FaSync, FaEye } from "react-icons/fa";
import { toaster } from "@decky/api";
import { UseSettingsReturn } from "../../hooks/useSettings";
import { refreshCache } from "../../services/api";
import { GameSelectionModal } from "../game/GameSelectionModal";
import { GameInfo, TrackedGame } from "../../models";

interface SettingsTabProps {
  settings: UseSettingsReturn;
  installedGames: GameInfo[];
  trackedGame: TrackedGame | null;
  onFullRefresh?: () => Promise<void>;
  onSetTrackedGame: (game: TrackedGame) => Promise<void>;
  onClearTrackedGame: () => Promise<void>;
}

export const SettingsTab: VFC<SettingsTabProps> = ({ 
  settings, 
  installedGames, 
  trackedGame, 
  onFullRefresh, 
  onSetTrackedGame, 
  onClearTrackedGame 
}) => {
  const formatIntervalDisplay = (interval: number): string => {
    return interval < 60 ? `${interval} seconds` : `${interval / 60} minutes`;
  };

  const handleClearCache = async () => {
    try {
      await refreshCache();
      toaster.toast({
        title: "Cache Cleared",
        body: "Achievement cache has been cleared!"
      });
    } catch (error) {
      toaster.toast({
        title: "Error",
        body: "Failed to clear cache",
        critical: true
      });
    }
  };

  const handleSaveApiKey = async () => {
    const success = await settings.saveApiKey();
    if (success && onFullRefresh) {
      await onFullRefresh();
    }
  };

  const handleSelectTrackedGame = useCallback(() => {
    if (installedGames.length === 0) {
      toaster.toast({
        title: "No Games Available",
        body: "Please visit the Overall tab first to load your games library.",
        critical: true
      });
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

  const handleSetTestGame = async () => {
    const success = await settings.handleSetTestGame();
    if (success && onFullRefresh) {
      await onFullRefresh();
    }
  };

  const handleClearTestGame = async () => {
    const success = await settings.handleClearTestGame();
    if (success && onFullRefresh) {
      await onFullRefresh();
    }
  };

  return (
    <div style={{ padding: "0", margin: "0" }}>
      {/* Steam API Configuration */}
      <PanelSection title="Steam API Configuration">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "8px" }}>
            Get your API key from: steamcommunity.com/dev/apikey
          </div>
        </PanelSectionRow>
        
        <PanelSectionRow>
          <TextField
            label="Steam API Key"
            value={settings.steamApiKey}
            onChange={(e: any) => settings.setSteamApiKeyState(e.target.value)}
            bIsPassword={true}
          />
        </PanelSectionRow>
        
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleSaveApiKey}
            disabled={!settings.steamApiKey}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
              <FaKey style={{ fontSize: "12px" }} />
              Save API Key
            </div>
          </ButtonItem>
        </PanelSectionRow>
        
        <PanelSectionRow>
          <div style={{ 
            color: settings.apiKeySet ? "#4CAF50" : "#ff6b6b", 
            fontSize: "12px" 
          }}>
            {settings.apiKeySet ? "✓ API Key is configured" : "✗ No API Key configured"}
          </div>
        </PanelSectionRow>
      </PanelSection>
      
      {/* Steam User ID Display */}
      <PanelSection title="Steam User">
        <PanelSectionRow>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Steam User ID:</span>
            <span style={{ 
              fontFamily: "monospace", 
              fontSize: "12px",
              opacity: settings.steamUserId ? 1 : 0.5
            }}>
              {settings.steamUserId || "Not detected"}
            </span>
          </div>
        </PanelSectionRow>
        
        {settings.steamUserId && (
          <PanelSectionRow>
            <div style={{ fontSize: "11px", opacity: 0.6 }}>
              Automatically detected from Steam installation
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* Auto Refresh Settings */}
      <PanelSection title="Auto Refresh">
        <PanelSectionRow>
          <ToggleField
            label="Enable auto-refresh"
            description="Update achievements automatically"
            checked={settings.autoRefresh}
            onChange={settings.saveAutoRefresh}
          />
        </PanelSectionRow>
        
        {settings.autoRefresh && (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => {
                showContextMenu(
                  <Menu label="Refresh Interval">
                    <MenuItem onClick={() => settings.saveRefreshInterval(15)}>
                      15 seconds
                    </MenuItem>
                    <MenuItem onClick={() => settings.saveRefreshInterval(30)}>
                      30 seconds
                    </MenuItem>
                    <MenuItem onClick={() => settings.saveRefreshInterval(60)}>
                      1 minute
                    </MenuItem>
                    <MenuItem onClick={() => settings.saveRefreshInterval(300)}>
                      5 minutes
                    </MenuItem>
                  </Menu>
                );
              }}
            >
              <div style={{ fontSize: "14px" }}>
                Interval: {formatIntervalDisplay(settings.refreshInterval)}
              </div>
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* Testing Section */}
      <PanelSection title="Testing">
        <PanelSectionRow>
          <TextField
            label="Test Game ID"
            value={settings.testGameId}
            onChange={(e: any) => settings.setTestGameId(e.target.value)}
            description="Steam App ID (e.g., 730 for CS:GO)"
          />
        </PanelSectionRow>
        
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleSetTestGame}
            disabled={!settings.testGameId}
          >
            <div style={{ fontSize: "14px" }}>
              Set Test Game
            </div>
          </ButtonItem>
        </PanelSectionRow>
        
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleClearTestGame}
          >
            <div style={{ fontSize: "14px" }}>
              Clear Test Game
            </div>
          </ButtonItem>
        </PanelSectionRow>
        
        <PanelSectionRow>
          <div style={{ fontSize: "11px", opacity: 0.6 }}>
            Examples: 730 (CS:GO), 570 (Dota 2), 440 (TF2)
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* Tracked Game */}
      <PanelSection title="Tracked Game">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "8px" }}>
            Set a game to track its achievements even when not running
          </div>
        </PanelSectionRow>
        
        {trackedGame && (
          <PanelSectionRow>
            <div style={{ 
              padding: "10px",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "4px",
              marginBottom: "8px"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "14px" }}>
                <FaEye style={{ marginRight: "8px", color: "#4a9eff" }} />
                {trackedGame.name}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                App ID: {trackedGame.app_id}
              </div>
            </div>
          </PanelSectionRow>
        )}
        
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleSelectTrackedGame}
          >
            <div style={{ fontSize: "14px" }}>
              {trackedGame ? "Change Tracked Game" : "Select Tracked Game"}
            </div>
          </ButtonItem>
        </PanelSectionRow>
        
        {trackedGame && (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                console.log("SettingsTab: Clear tracked game clicked");
                if (onClearTrackedGame) {
                  try {
                    await onClearTrackedGame();
                    console.log("SettingsTab: Clear tracked game completed");
                  } catch (error) {
                    console.error("SettingsTab: Clear tracked game failed:", error);
                  }
                } else {
                  console.error("SettingsTab: onClearTrackedGame is not defined");
                }
              }}
            >
              <div style={{ fontSize: "14px" }}>
                Clear Tracked Game
              </div>
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>
      
      {/* Cache Management */}
      <PanelSection title="Cache">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleClearCache}
          >
            <div style={{ fontSize: "14px" }}>
              Clear All Cache
            </div>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {/* Settings Management */}
      <PanelSection title="Settings Management">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={settings.handleReloadSettings}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
              <FaSync style={{ fontSize: "12px" }} />
              Reload Settings
            </div>
          </ButtonItem>
        </PanelSectionRow>
        
        <PanelSectionRow>
          <div style={{ fontSize: "11px", opacity: 0.6 }}>
            Force reload settings from disk if they're not updating
          </div>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};