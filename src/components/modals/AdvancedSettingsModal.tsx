// components/modals/AdvancedSettingsModal.tsx
import { VFC, useState, useEffect } from "react";
import { 
  ModalRoot, 
  TextField, 
  ButtonItem,
  PanelSection,
  PanelSectionRow
} from "@decky/ui";
import { FaCog, FaGamepad } from "react-icons/fa";

interface AdvancedSettingsModalProps {
  currentTestGameId: string;
  onSaveTestGame: (gameId: string) => Promise<boolean>;
  onClearTestGame: () => Promise<boolean>;
  closeModal?: () => void;
}

export const AdvancedSettingsModal: VFC<AdvancedSettingsModalProps> = ({ 
  currentTestGameId,
  onSaveTestGame,
  onClearTestGame,
  closeModal 
}) => {
  const [testGameId, setTestGameId] = useState(currentTestGameId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTestGameId(currentTestGameId);
  }, [currentTestGameId]);

  const validateGameId = (id: string): boolean => {
    // Steam App IDs are numeric and typically 1-7 digits
    const gameIdPattern = /^\d{1,7}$/;
    return gameIdPattern.test(id.trim());
  };

  const handleSaveTestGame = async () => {
    if (!validateGameId(testGameId)) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTestGame(testGameId.trim());
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearTestGame = async () => {
    setIsSaving(true);
    try {
      const success = await onClearTestGame();
      if (success) {
        setTestGameId("");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getGameExamples = () => [
    { name: "Counter-Strike 2", id: "730" },
    { name: "Dota 2", id: "570" },
    { name: "Team Fortress 2", id: "440" },
    { name: "Portal 2", id: "620" },
    { name: "Half-Life 2", id: "220" }
  ];

  return (
    <ModalRoot onCancel={closeModal}>
      <div style={{ 
        padding: "20px", 
        minWidth: "450px", 
        maxWidth: "550px" 
      }}>
        <PanelSection title="">
          <div style={{ 
            textAlign: "center", 
            marginBottom: "20px" 
          }}>
            <FaCog style={{ fontSize: "32px", color: "#4a9eff", marginBottom: "10px" }} />
            <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
              Testing Options
            </h2>
            <p style={{ 
              margin: "0", 
              fontSize: "14px", 
              opacity: 0.8,
              lineHeight: "1.4"
            }}>
              Configure game testing for development
            </p>
          </div>
        </PanelSection>

        {/* Test Game Section */}
        <PanelSection title="🎮 Test Game">
          <PanelSectionRow>
            <div style={{ 
              fontSize: "13px", 
              opacity: 0.8, 
              marginBottom: "10px",
              lineHeight: "1.4"
            }}>
              Override game detection to test achievement tracking for a specific game, even when not running. Useful for development and testing.
            </div>
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField
              label="Steam App ID"
              value={testGameId}
              onChange={(e: any) => setTestGameId(e.target.value)}
              disabled={isSaving}
              description="Numeric game ID from Steam"
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <div style={{ 
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "12px"
            }}>
              <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Popular Game IDs:
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "4px",
                opacity: 0.9
              }}>
                {getGameExamples().map(game => (
                  <div 
                    key={game.id}
                    style={{ 
                      cursor: "pointer",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      transition: "background-color 0.2s"
                    }}
                    onClick={() => setTestGameId(game.id)}
                  >
                    <span style={{ fontFamily: "monospace", color: "#4a9eff" }}>
                      {game.id}
                    </span> - {game.name}
                  </div>
                ))}
              </div>
            </div>
          </PanelSectionRow>

          <PanelSectionRow>
            <div style={{ display: "flex", gap: "10px" }}>
              <ButtonItem
                onClick={handleSaveTestGame}
                disabled={!validateGameId(testGameId) || isSaving}
              >
                <FaGamepad style={{ marginRight: "6px" }} />
                Set Test Game
              </ButtonItem>
              
              {testGameId && (
                <ButtonItem
                  onClick={handleClearTestGame}
                  disabled={isSaving}
                >
                  Clear
                </ButtonItem>
              )}
            </div>
          </PanelSectionRow>
        </PanelSection>

        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          marginTop: "20px" 
        }}>
          <ButtonItem onClick={closeModal}>
            Close
          </ButtonItem>
        </div>
      </div>
    </ModalRoot>
  );
};