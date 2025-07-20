import type { Spell } from '../types'

interface SpellSidebarProps {
  spells: Spell[]
  selectedSpell: Spell | null
  onSpellSelect: (spell: Spell) => void
  onSpellsChange: () => void
  onAddSpell: () => void
  onEditSpell: () => void
  onDeleteSpell: () => void
  onAddSpellToCharacter?: (spell: Spell) => void
  hasSelectedCharacter: boolean
  loading: boolean
}

export function SpellSidebar({
  spells,
  selectedSpell,
  onSpellSelect,
  onAddSpell,
  onEditSpell,
  onDeleteSpell,
  onAddSpellToCharacter,
  hasSelectedCharacter,
  loading
}: SpellSidebarProps) {

  const handleDragStart = (e: React.DragEvent, spell: Spell) => {
    e.dataTransfer.setData('application/json', JSON.stringify(spell))
    e.dataTransfer.effectAllowed = 'copy'
  }
  return (
    <div className="w-80 flex-shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center h-[76px]">
        <h2 className="text-xl font-semibold">Spells</h2>
        <div className="flex gap-2">
          <button 
            onClick={onAddSpell}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors" 
            title="Add Spell"
          >
            +
          </button>
          <button 
            onClick={onEditSpell}
            disabled={!selectedSpell}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors" 
            title={selectedSpell ? "Edit Spell" : "Select a spell to edit"}
          >
            ✏️
          </button>
          <button 
            onClick={onDeleteSpell}
            disabled={!selectedSpell}
            className="bg-gray-700 hover:bg-red-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors" 
            title={selectedSpell ? "Delete Spell" : "Select a spell to delete"}
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-gray-400 italic">
            Loading spells...
          </div>
        ) : spells.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-400 italic">
            No spells found
          </div>
        ) : (
          spells
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(spell => (
            <div
              key={spell.id}
              className={`p-3 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700 relative group ${
                selectedSpell?.id === spell.id
                  ? 'bg-gray-700 border-r-4 border-r-blue-500'
                  : ''
              }`}
              draggable={hasSelectedCharacter}
              onDragStart={(e) => handleDragStart(e, spell)}
              onClick={() => onSpellSelect(spell)}
            >
              <div className="font-medium pr-8">{spell.name}</div>
              <div className="text-sm text-gray-400">{spell.convocation} • Level {spell.complexityLevel}</div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{spell.description}</div>

              {/* Add to character button */}
              {hasSelectedCharacter && onAddSpellToCharacter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddSpellToCharacter(spell)
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Add spell to character"
                >
                  +
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
