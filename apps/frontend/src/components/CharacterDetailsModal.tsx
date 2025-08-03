import { type Character } from "@repo/types";
import { Modal } from "./Modal";

interface CharacterDetailsModalProps {
  character: Character;
  onClose: () => void;
  isOpen: boolean;
}

export function CharacterDetailsModal({
  character,
  onClose,
  isOpen,
}: CharacterDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={character.name} size="md">
      <div className="space-y-4">
        {/* Character Name */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Character Name</h3>
          <div className="text-gray-300">{character.name}</div>
        </div>

        {/* Convocations */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Convocations</h3>
          <div className="flex flex-wrap gap-2">
            {character.convocations.map((convocation) => (
              <span
                key={convocation}
                className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
              >
                {convocation}
              </span>
            ))}
          </div>
        </div>

        {/* Rank */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Rank</h3>
          <div className="text-gray-300">{character.rank}</div>
        </div>

        {/* Game Information */}
        {character.game && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Game Information</h3>
            <div className="text-gray-300">{character.game}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
