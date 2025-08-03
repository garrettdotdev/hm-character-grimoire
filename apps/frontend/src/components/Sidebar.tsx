import type { Character } from "@repo/types";

interface SidebarProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onCharacterSelect: (character: Character) => void;
  onCharactersChange: () => void;
  onAddCharacter: () => void;
  onEditCharacter: () => void;
  onDeleteCharacter: () => void;
  onViewCharacterDetails: () => void;
  onImportCharacters: () => void;
  loading: boolean;
}

export function Sidebar({
  characters,
  selectedCharacter,
  onCharacterSelect,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onViewCharacterDetails,
  onImportCharacters,
  loading,
}: SidebarProps) {
  const handleCharacterDoubleClick = (character: Character) => {
    onCharacterSelect(character); // Ensure the character is selected
    onViewCharacterDetails(); // Open the details modal
  };
  return (
    <div className="min-w-80 w-fit flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center h-[76px]">
        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={onAddCharacter}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
            title="Add Character"
          >
            +
          </button>
          <button
            onClick={onViewCharacterDetails}
            disabled={!selectedCharacter}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
            title={
              selectedCharacter
                ? "View Character Details"
                : "Select a character to view details"
            }
          >
            👁️
          </button>
          <button
            onClick={onEditCharacter}
            disabled={!selectedCharacter}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
            title={
              selectedCharacter
                ? "Edit Character"
                : "Select a character to edit"
            }
          >
            ✏️
          </button>
          <button
            onClick={onDeleteCharacter}
            disabled={!selectedCharacter}
            className="bg-gray-700 hover:bg-red-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
            title={
              selectedCharacter
                ? "Delete Character"
                : "Select a character to delete"
            }
          >
            🗑️
          </button>
          <button
            onClick={onImportCharacters}
            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors"
            title="Import Characters from JSON"
          >
            📥
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-80">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-gray-400 italic">
            Loading characters...
          </div>
        ) : characters.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-400 italic">
            No characters found
          </div>
        ) : (
          characters
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((character) => (
              <div
                key={character.id}
                className={`p-3 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700 ${
                  selectedCharacter?.id === character.id
                    ? "bg-gray-700 border-l-4 border-l-blue-500"
                    : ""
                }`}
                onClick={() => onCharacterSelect(character)}
                onDoubleClick={() => handleCharacterDoubleClick(character)}
              >
                <div className="font-medium truncate">{character.name}</div>
                <div className="text-sm text-gray-400 truncate">
                  {character.rank} • {character.convocations.join(", ")}
                </div>
                {character.game && (
                  <div className="text-xs text-gray-500">{character.game}</div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
