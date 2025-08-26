// components/modals/ApiKeyModal.tsx
import { VFC, useState, useEffect } from "react";
import {
  ModalRoot,
  TextField,
  ButtonItem,
  PanelSection,
  PanelSectionRow
} from "@decky/ui";
import { FaKey, FaExternalLinkAlt, FaCheck, FaTimes, FaClipboard } from "react-icons/fa";

interface ApiKeyModalProps {
  currentApiKey: string;
  onSave: (apiKey: string) => Promise<boolean>;
  closeModal?: () => void;
}

export const ApiKeyModal: VFC<ApiKeyModalProps> = ({
  currentApiKey,
  onSave,
  closeModal
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isGamingMode, setIsGamingMode] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey]);

  const validateApiKey = (key: string): boolean => {
    // Steam API keys are 32 character hex strings
    const apiKeyPattern = /^[A-Fa-f0-9]{32}$/;
    return apiKeyPattern.test(key.trim());
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setValidationMessage("");

    if (value.trim().length > 0) {
      if (validateApiKey(value)) {
        setValidationMessage("✓ Valid API key format");
      } else {
        setValidationMessage("✗ Invalid API key format (should be 32 hex characters)");
      }
    }
  };

  // Add this useEffect to detect Gaming Mode:
  useEffect(() => {
    const checkGamingMode = () => {
      SteamClient.UI.GetUIMode()
        .then(mode => {
          console.log("Current UI Mode:", mode);
          setIsGamingMode(mode === 4)
        })
        .catch(err => {
          console.error("Failed to get UI mode:", err);
          setIsGamingMode(true);
        })// Default to false on error
    };

    checkGamingMode();
  }, []);

  const handleSave = async () => {
    if (!validateApiKey(apiKey)) {
      setValidationMessage("Please enter a valid Steam API key");
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(apiKey.trim());
      if (success) {
        closeModal?.();
      } else {
        setValidationMessage("Failed to save API key. Please try again.");
      }
    } catch (error) {
      setValidationMessage("Error saving API key. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalRoot onCancel={closeModal}>
      <div style={{
        padding: "20px",
        width: "100%",
        maxWidth: "500px", 
        minHeight: "0",
        margin: "0 auto" 
      }}>
        <PanelSection title="">
          <div style={{
            textAlign: "center",
            marginBottom: "20px"
          }}>
            <FaKey style={{ fontSize: "32px", color: "#4a9eff", marginBottom: "10px" }} />
            <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
              Configure Steam API Key
            </h2>
            <p style={{
              margin: "0",
              fontSize: "14px",
              opacity: 0.8,
              lineHeight: "1.4"
            }}>
              Enter your Steam Web API key to enable achievement tracking
            </p>
          </div>
        </PanelSection>

        <PanelSection>
          <PanelSectionRow>
            <div style={{
              backgroundColor: "rgba(74, 158, 255, 0.1)",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px"
              }}>
                <FaExternalLinkAlt style={{ fontSize: "12px" }} />
                <strong style={{ fontSize: "13px" }}>Get Your API Key</strong>
              </div>
              <p style={{
                margin: "0",
                fontSize: "12px",
                opacity: 0.9,
                lineHeight: "1.3"
              }}>
                Visit <strong>steamcommunity.com/dev/apikey</strong> to generate your free API key.
                Choose any domain name (e.g., "localhost").
              </p>
            </div>
          </PanelSectionRow>

          {isGamingMode ? (
            <PanelSectionRow>
              <div style={{
                backgroundColor: "rgba(255, 193, 7, 0.1)",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid rgba(255, 193, 7, 0.3)"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px"
                }}>
                  <FaClipboard style={{ fontSize: "12px", color: "#ffc107" }} />
                  <strong style={{ fontSize: "13px", color: "#ffc107" }}>Gaming Mode Notice</strong>
                </div>
                <p style={{
                  margin: "0",
                  fontSize: "12px",
                  opacity: 0.9,
                  lineHeight: "1.3"
                }}>
                  Clipboard paste is restricted in Gaming Mode for security.
                  Please type your API key manually or switch to Desktop Mode for paste functionality.
                </p>
              </div>
            </PanelSectionRow>
          ) : (
            <PanelSectionRow>
              <div style={{
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid rgba(76, 175, 80, 0.3)"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px"
                }}>
                  <FaClipboard style={{ fontSize: "12px", color: "#4CAF50" }} />
                  <strong style={{ fontSize: "13px", color: "#4CAF50" }}>Desktop Mode Tip</strong>
                </div>
                <p style={{
                  margin: "0",
                  fontSize: "12px",
                  opacity: 0.9,
                  lineHeight: "1.3"
                }}>
                  Copy your API key, then click in the text field below and use the paste button on the virtual keyboard.
                </p>
              </div>
            </PanelSectionRow>
          )}

          <PanelSectionRow>
            <TextField
              label="Steam API Key"
              value={apiKey}
              onChange={(e: any) => handleApiKeyChange(e.target.value)}
              disabled={isSaving}
              description="32-character hexadecimal key"
              focusOnMount={true}
            />
          </PanelSectionRow>

          {validationMessage && (
            <PanelSectionRow>
              <div style={{
                color: validationMessage.startsWith("✓") ? "#4CAF50" : "#ff6b6b",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                {validationMessage.startsWith("✓") ?
                  <FaCheck style={{ fontSize: "10px" }} /> :
                  <FaTimes style={{ fontSize: "10px" }} />
                }
                {validationMessage}
              </div>
            </PanelSectionRow>
          )}
        </PanelSection>

        <PanelSection>
          <PanelSectionRow>
            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              width: "100%"
            }}>
              <ButtonItem
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancel
              </ButtonItem>

              <ButtonItem
                onClick={handleSave}
                disabled={!validateApiKey(apiKey) || isSaving}
              >
                {isSaving ? "Saving..." : "Save API Key"}
              </ButtonItem>
            </div>
          </PanelSectionRow>
        </PanelSection>
      </div>
    </ModalRoot>
  );
};