import { useState, useEffect } from 'react'
import type { Character, Spell } from '../types'
import { SpellCard } from './SpellCard'

interface MainContentProps {
  selectedCharacter: Character | null
}

export function MainContent({ selectedCharacter }: MainContentProps) {
  const [spells, setSpells] = useState<Spell[]>([])
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConvocation, setSelectedConvocation] = useState<string>('all')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const convocations = ['Lyahvi', 'Peleahn', 'Jmorvi', 'Fyvria', 'Odivshe', 'Savorya', 'Neutral']

  useEffect(() => {
    if (selectedCharacter) {
      fetchCharacterSpells(selectedCharacter.id)
    } else {
      setSpells([])
      setFilteredSpells([])
    }
  }, [selectedCharacter])

  useEffect(() => {
    filterSpells()
  }, [spells, searchTerm, selectedConvocation, selectedComplexity])

  const fetchCharacterSpells = async (characterId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/characters/${characterId}/spells`)
      const data = await response.json()
      setSpells(data.spells || [])
    } catch (error) {
      console.error('Failed to fetch character spells:', error)
      setSpells([])
    } finally {
      setLoading(false)
    }
  }

  const filterSpells = () => {
    let filtered = spells

    if (searchTerm) {
      filtered = filtered.filter(spell =>
        spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedConvocation !== 'all') {
      filtered = filtered.filter(spell => spell.convocation === selectedConvocation)
    }

    if (selectedComplexity !== 'all') {
      filtered = filtered.filter(spell => spell.complexityLevel.toString() === selectedComplexity)
    }

    setFilteredSpells(filtered)
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedConvocation}
            onChange={(e) => setSelectedConvocation(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Convocations</option>
            {convocations.map(conv => (
              <option key={conv} value={conv}>{conv}</option>
            ))}
          </select>
          
          <select
            value={selectedComplexity}
            onChange={(e) => setSelectedComplexity(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Complexity</option>
            {[1,2,3,4,5,6,7,8,9,10].map(level => (
              <option key={level} value={level.toString()}>Level {level}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 p-4 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 overflow-y-auto">
        {!selectedCharacter ? (
          <div className="col-span-full flex items-center justify-center p-8 text-gray-400 italic">
            Select a character to view their spells
          </div>
        ) : loading ? (
          <div className="col-span-full flex items-center justify-center p-8 text-gray-400 italic">
            Loading spells...
          </div>
        ) : filteredSpells.length === 0 ? (
          <div className="col-span-full flex items-center justify-center p-8 text-gray-400 italic">
            No spells found
          </div>
        ) : (
          filteredSpells.map(spell => (
            <SpellCard key={spell.id} spell={spell} />
          ))
        )}
      </div>
    </div>
  )
}