import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { MainContent } from './components/MainContent'
import type { Character } from './types'
import './App.css'

function App() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/characters')
      const data = await response.json()
      setCharacters(data.characters || [])
    } catch (error) {
      console.error('Failed to fetch characters:', error)
      setCharacters([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar 
        characters={characters}
        selectedCharacter={selectedCharacter}
        onCharacterSelect={setSelectedCharacter}
        onCharactersChange={fetchCharacters}
        loading={loading}
      />
      <MainContent selectedCharacter={selectedCharacter} />
    </div>
  )
}

export default App
