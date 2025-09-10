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
  FaCheck,
  FaTimes,
  FaTools
} from "../../utils/icons";
import { toaster } from "@decky/api";
import { logger } from "../../utils/logger";
import { UseSettingsReturn } from "../../hooks/useSettings";
import { GameSelectionModal } from "../game/GameSelectionModal";
import { ApiKeyModal } from "../modals/ApiKeyModal";
import { AdvancedSettingsModal } from "../modals/AdvancedSettingsModal";
import { TroubleshootingModal } from "../modals/TroubleshootingModal";
import { GameInfo, TrackedGame } from "../../models";


interface SettingsTabModalProps {
  settings: UseSettingsReturn;
  games: GameInfo[];
  trackedGame: TrackedGame | null;
  onFullRefresh?: () => Promise<void>;
  onForceRefreshRecent?: () => Promise<void>;
  onSetTrackedGame: (game: TrackedGame) => Promise<void>;
  onClearTrackedGame: () => Promise<void>;
}

export const SettingsTabModal: VFC<SettingsTabModalProps> = ({
  settings,
  games,
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

  const handleOpenTroubleshooting = useCallback(() => {
    let modalInstance: any = null;

    modalInstance = showModal(
      <TroubleshootingModal
        settings={settings}
        onFullRefresh={onFullRefresh}
        closeModal={() => modalInstance?.Close()}
      />
    );
  }, [settings, onFullRefresh]);

  const handleSelectTrackedGame = useCallback(() => {
    if (!games?.length) {
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
        games={games}
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
  }, [games, onSetTrackedGame]);


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
                    <MenuItem onClick={() => settings.saveRefreshInterval(30)}>
                      30 seconds
                    </MenuItem>
                    <MenuItem onClick={() => settings.saveRefreshInterval(60)}>
                      1 minute (recommended)
                    </MenuItem>
                    <MenuItem onClick={() => settings.saveRefreshInterval(120)}>
                      2 minutes
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
                    logger.error("Failed to clear tracked game:", error);
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

      {/* Troubleshooting Section */}
      <PanelSection title="Troubleshooting">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "12px" }}>
            Having issues? Access diagnostic tools and fixes:
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleOpenTroubleshooting}
          >
            <div style={{
              display: "flex",
              textAlign: "left",
              gap: "12px",
              padding: "6px 0"
            }}>
              <FaTools style={{ 
                fontSize: "18px", 
                color: "#4a9eff", 
                width: "18px", 
                textAlign: "center", 
                display: "inline-block",
                marginTop: "2px"
              }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                  Open Troubleshooting Tools
                </div>
              </div>
            </div>
          </ButtonItem>
        </PanelSectionRow>

        {onFullRefresh && (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                try {
                  await onFullRefresh();
                } catch (error) {
                  logger.error("Force refresh failed:", error);
                }
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px"
              }}>
                <FaSync style={{ fontSize: "14px" }} />
                Force Refresh All Data
              </div>
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>
    </div>
  );
};