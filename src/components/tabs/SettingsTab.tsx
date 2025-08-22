// components/tabs/SettingsTab.tsx
import { VFC } from "react";
import { 
  PanelSection, 
  PanelSectionRow, 
  ButtonItem, 
  TextField, 
  ToggleField,
  Menu,
  MenuItem,
  showContextMenu
} from "@decky/ui";
import { FaKey, FaSync } from "react-icons/fa";
import { toaster } from "@decky/api";
import { UseSettingsReturn } from "../../hooks/useSettings";
import { refreshCache } from "../../services/api";

interface SettingsTabProps {
  settings: UseSettingsReturn;
  onFullRefresh?: () => Promise<void>;
}

export const SettingsTab: VFC<SettingsTabProps> = ({ settings, onFullRefresh }) => {
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
    <>
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaKey />
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
              Interval: {formatIntervalDisplay(settings.refreshInterval)}
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
            Set Test Game
          </ButtonItem>
        </PanelSectionRow>
        
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleClearTestGame}
          >
            Clear Test Game
          </ButtonItem>
        </PanelSectionRow>
        
        <PanelSectionRow>
          <div style={{ fontSize: "11px", opacity: 0.6 }}>
            Examples: 730 (CS:GO), 570 (Dota 2), 440 (TF2)
          </div>
        </PanelSectionRow>
      </PanelSection>
      
      {/* Cache Management */}
      <PanelSection title="Cache">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleClearCache}
          >
            Clear All Cache
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaSync />
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
    </>
  );
};