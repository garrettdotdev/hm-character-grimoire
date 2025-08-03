import type { Spell } from "@repo/types";

interface SpellListItemProps {
  spell: Spell;
  selectedSpell: Spell | null;
  onSpellSelect: (spell: Spell) => void;
  onViewSpellDetails: () => void;
  onAddSpellToCharacter?: (spell: Spell) => void;
  hasSelectedCharacter: boolean;
  onMoveSpell?: (spellId: string, newFolderId: number) => void;
  indentLevel?: number; // For folder tree indentation
}

export function SpellListItem({
  spell,
  selectedSpell,
  onSpellSelect,
  onViewSpellDetails,
  onAddSpellToCharacter,
  hasSelectedCharacter,
  onMoveSpell: _onMoveSpell, // Prefix with underscore to indicate intentionally unused
  indentLevel = 0,
}: SpellListItemProps) {
  const handleSpellDragStart = (e: React.DragEvent, spell: Spell) => {
    e.dataTransfer.setData("application/json", JSON.stringify(spell));
    e.dataTransfer.setData("text/plain", "spell"); // Type identifier
    e.dataTransfer.effectAllowed = "copyMove"; // Allow both copy (for characters) and move (for folders)
    console.log("Starting drag for spell:", spell.name, "with effect: copyMove");
  };

  const handleDoubleClick = () => {
    onSpellSelect(spell); // Ensure the spell is selected
    onViewSpellDetails(); // Open the details modal
  };

  return (
    <div
      key={spell.id}
      className={`p-3 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700 relative group ${
        selectedSpell?.id === spell.id
          ? "bg-gray-700 border-r-4 border-r-blue-500"
          : ""
      }`}
      style={{ paddingLeft: `${indentLevel + 20}px` }}
      draggable={true} // Always draggable for both folder moves and character assignment
      onDragStart={(e) => handleSpellDragStart(e, spell)}
      onClick={() => onSpellSelect(spell)}
      onDoubleClick={handleDoubleClick}
    >
      <div className="font-medium pr-8 truncate">{spell.name}</div>
      <div className="text-sm text-gray-400 truncate">
        {spell.convocation} • Level {spell.complexityLevel}
      </div>
      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
        {spell.description}
      </div>

      {/* Add to character button */}
      {hasSelectedCharacter && onAddSpellToCharacter && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSpellToCharacter(spell);
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          title="Add spell to character"
        >
          +
        </button>
      )}
    </div>
  );
}
