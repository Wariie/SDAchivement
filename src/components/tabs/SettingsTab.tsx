// components/tabs/SettingsTabModal.tsx - Modal-based settings redesign
import { VFC, useCallback } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  showModal,
  MenuItem,
  Menu,
  showContextMenu
} from "@decky/ui";
import {
  FaKey,
  FaCog,
  FaSync,
  FaEye,
  FaTrash,
  FaGamepad,
  FaUser,
  FaCheck,
  FaTimes
} from "react-icons/fa";
import { toaster } from "@decky/api";
import { UseSettingsReturn } from "../../hooks/useSettings";
import { refreshCache } from "../../services/api";
import { GameSelectionModal } from "../game/GameSelectionModal";
import { ApiKeyModal } from "../modals/ApiKeyModal";
import { AdvancedSettingsModal } from "../modals/AdvancedSettingsModal";
import { GameInfo, TrackedGame } from "../../models";

interface SettingsTabModalProps {
  settings: UseSettingsReturn;
  installedGames: GameInfo[];
  trackedGame: TrackedGame | null;
  onFullRefresh?: () => Promise<void>;
  onSetTrackedGame: (game: TrackedGame) => Promise<void>;
  onClearTrackedGame: () => Promise<void>;
}

export const SettingsTabModal: VFC<SettingsTabModalProps> = ({
  settings,
  installedGames,
  trackedGame,
  onFullRefresh,
  onSetTrackedGame,
  onClearTrackedGame
}) => {

  const handleOpenApiKeyModal = useCallback(() => {
    let modalInstance: any = null;

    modalInstance = showModal(
      <ApiKeyModal
        currentApiKey={settings.steamApiKey}
        onSave={async (apiKey: string) => {
          const success = await settings.saveApiKey(apiKey);
          if (success && onFullRefresh) {
            await onFullRefresh();
          }
          return success;
        }}
        closeModal={() => modalInstance?.Close()}
      />
    );
  }, [settings.setSteamApiKeyState, settings.saveApiKey, onFullRefresh]);

  const handleOpenAdvancedSettings = useCallback(() => {
    let modalInstance: any = null;

    modalInstance = showModal(
      <AdvancedSettingsModal
        currentTestGameId={settings.testGameId}
        onSaveTestGame={settings.handleSetTestGame}
        onClearTestGame={settings.handleClearTestGame}
        closeModal={() => modalInstance?.Close()}
      />
    );
  }, [settings]);

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
        closeModal={() => modalInstance?.Close()}
      />
    );
  }, [installedGames, onSetTrackedGame]);

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

  return (
    <div style={{ padding: "0", margin: "0" }}>
      {/* Quick Status Overview */}
      <PanelSection title="Configuration Status">
        <PanelSectionRow>
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "8px"
          }}>
            {/* API Key Status */}
            <div style={{
              padding: "12px",
              backgroundColor: settings.apiKeySet ?
                "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
              borderRadius: "8px",
              border: `1px solid ${settings.apiKeySet ? '#4CAF50' : '#F44336'}40`,
              width: "100%",
              maxWidth: "300px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
                }}>
                {settings.apiKeySet ?
                  <FaCheck style={{ color: "#4CAF50", fontSize: "14px" }} /> :
                  <FaTimes style={{ color: "#F44336", fontSize: "14px" }} />
                }
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                  Steam API {settings.apiKeySet ? "Configured" : "Not Configured"}
                </span>
              </div>
            </div>
          </div>
        </PanelSectionRow>

        {settings.steamUserId && (
          <PanelSectionRow>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "12px",
              opacity: 0.7,
              fontFamily: "monospace"
            }}>
              <FaUser style={{ fontSize: "10px" }} />
              User ID: {settings.steamUserId}
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* Main Configuration Actions */}
      <PanelSection title="Configuration">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleOpenApiKeyModal}
          >
            <div style={{
              display: "flex",
              textAlign: "left",
              gap: "10px",
              padding: "4px 0"
            }}>
              <FaKey style={{ fontSize: "16px", color: "#4a9eff", width: "16px", textAlign: "center", display: "inline-block" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                  Steam API Key
                </div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {settings.apiKeySet ? "Update your API key" : "Configure API key to enable features"}
                </div>
              </div>
            </div>
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleOpenAdvancedSettings}
          >
            <div style={{
              display: "flex",
              textAlign: "left",
              gap: "10px",
              padding: "4px 0"
            }}>
              <FaCog style={{ fontSize: "16px", color: "#4a9eff", width: "16px", textAlign: "center", display: "inline-block" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                  Testing Options
                </div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  Test specific games for development
                </div>
              </div>
            </div>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {/* Auto Refresh Settings */}
      <PanelSection title="Auto Refresh">
        <PanelSectionRow>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
          }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                Auto-refresh achievements
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                Update automatically while viewing current game
              </div>
            </div>
            <div style={{
              padding: "4px 8px",
              borderRadius: "12px",
              backgroundColor: settings.autoRefresh ? "rgba(76, 175, 80, 0.2)" : "rgba(158, 158, 158, 0.2)",
              fontSize: "11px",
              fontWeight: "bold",
              color: settings.autoRefresh ? "#4CAF50" : "#999"
            }}>
              {settings.autoRefresh ? "ON" : "OFF"}
            </div>
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => settings.saveAutoRefresh(!settings.autoRefresh)}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px"
            }}>
              <FaSync style={{ fontSize: "14px" }} />
              {settings.autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}
            </div>
          </ButtonItem>
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
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px"
              }}>
                <FaCog style={{ fontSize: "12px" }} />
                Interval: {settings.refreshInterval < 60 ?
                  `${settings.refreshInterval} seconds` :
                  `${settings.refreshInterval / 60} minutes`}
              </div>
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* Tracked Game Section */}
      <PanelSection title="Tracked Game">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "12px" }}>
            Track achievements for a specific game even when not running
          </div>
        </PanelSectionRow>

        {trackedGame ? (
          <>
            <PanelSectionRow>
              <div style={{
                padding: "12px",
                backgroundColor: "rgba(74, 158, 255, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(74, 158, 255, 0.3)",
                marginBottom: "8px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px"
                }}>
                  <FaEye style={{ color: "#4a9eff", fontSize: "14px" }} />
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {trackedGame.name}
                  </span>
                </div>
                <div style={{ fontSize: "11px", opacity: 0.7, fontFamily: "monospace" }}>
                  App ID: {trackedGame.app_id}
                </div>
              </div>
            </PanelSectionRow>

            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={handleSelectTrackedGame}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px"
                }}>
                  <FaGamepad style={{ fontSize: "14px" }} />
                  Change Tracked Game
                </div>
              </ButtonItem>
            </PanelSectionRow>

            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={async () => {
                  try {
                    await onClearTrackedGame();
                  } catch (error) {
                    console.error("Failed to clear tracked game:", error);
                  }
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px"
                }}>
                  <FaTrash style={{ fontSize: "14px" }} />
                  Clear Tracked Game
                </div>
              </ButtonItem>
            </PanelSectionRow>
          </>
        ) : (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleSelectTrackedGame}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px"
              }}>
                <FaGamepad style={{ fontSize: "16px" }} />
                Select Tracked Game
              </div>
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* Maintenance Section */}
      <PanelSection title="Maintenance">
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleClearCache}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px"
            }}>
              <FaTrash style={{ fontSize: "12px" }} />
              Clear Cache
            </div>
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={settings.handleReloadSettings}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px"
            }}>
              <FaSync style={{ fontSize: "12px" }} />
              Reload Settings
            </div>
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <div style={{ fontSize: "11px", opacity: 0.6 }}>
            Use if settings aren't updating properly
          </div>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};