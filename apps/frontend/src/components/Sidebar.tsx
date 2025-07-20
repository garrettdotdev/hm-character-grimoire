import type { Character } from '../types'

interface SidebarProps {
  characters: Character[]
  selectedCharacter: Character | null
  onCharacterSelect: (character: Character) => void
  onCharactersChange: () => void
  loading: boolean
}

export function Sidebar({ 
  characters, 
  selectedCharacter, 
  onCharacterSelect,
  loading
}: SidebarProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Characters</h2>
        <div className="flex gap-2">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors" title="Add Character">
            +
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors" title="Edit Character">
            ✏️
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors" title="Delete Character">
            🗑️
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-gray-400 italic">
            Loading characters...
          </div>
        ) : characters.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-400 italic">
            No characters found
          </div>
        ) : (
          characters.map(character => (
            <div
              key={character.id}
              className={`p-3 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700 ${
                selectedCharacter?.id === character.id 
                  ? 'bg-gray-700 border-l-4 border-l-blue-500' 
                  : ''
              }`}
              onClick={() => onCharacterSelect(character)}
            >
              <div className="font-medium">{character.name}</div>
              <div className="text-sm text-gray-400">{character.occupation}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}