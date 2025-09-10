// components/game/GameSelectionModal.tsx
import { VFC, useState } from "react";
import { ConfirmModal, TextField, ButtonItem, Focusable } from "@decky/ui";
import { GameInfo } from "../../models";

interface GameSelectionModalProps {
  games: GameInfo[];
  onSelect: (game: GameInfo) => void;
  closeModal?: () => void;
}

export const GameSelectionModal: VFC<GameSelectionModalProps> = ({
  games,
  onSelect,
  closeModal
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ConfirmModal
      strTitle="Select Game to Track"
      strDescription="Choose a game to track recent achievements"
      onCancel={() => closeModal?.()}
      onOK={() => closeModal?.()}
      strOKButtonText="Close"
      bHideCloseIcon={false}
    >
      <div style={{ padding: "10px" }}>
        <TextField
          label="Search Games"
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
        />

        <div style={{
          marginTop: "10px"
        }}>
          <Focusable style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredGames.map((game) => (
              <ButtonItem
                key={game.app_id}
                layout="below"
                onClick={() => {
                  onSelect(game);
                  closeModal?.();
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {game.name}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>
                    {game.total_achievements} achievements • App ID: {game.app_id}
                  </div>
                </div>
              </ButtonItem>
            ))}
          </Focusable>
        </div>

        {filteredGames.length > 50 && (
          <div style={{
            marginTop: "10px",
            textAlign: "center",
            fontSize: "12px",
            opacity: 0.6
          }}>
            Showing first 50 of {filteredGames.length} games
          </div>
        )}
      </div>
    </ConfirmModal>
  );
};