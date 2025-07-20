import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { MainContent } from './components/MainContent'
import { SpellSidebar } from './components/SpellSidebar'
import { Modal } from './components/Modal'
import { CharacterForm } from './components/AddCharacterForm'
import { DeleteCharacterDialog } from './components/DeleteCharacterDialog'
import { SpellForm } from './components/SpellForm'
import { DeleteSpellDialog } from './components/DeleteSpellDialog'
import { NotificationBanner } from './components/NotificationBanner'
import type { Character, Spell } from './types'
import './App.css'

function App() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [spells, setSpells] = useState<Spell[]>([])
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null)
  const [loading, setLoading] = useState(false)
  const [spellsLoading, setSpellsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddSpellModal, setShowAddSpellModal] = useState(false)
  const [showEditSpellModal, setShowEditSpellModal] = useState(false)
  const [showDeleteSpellModal, setShowDeleteSpellModal] = useState(false)
  const [characterFormLoading, setCharacterFormLoading] = useState(false)
  const [spellFormLoading, setSpellFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSpellLoading, setDeleteSpellLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null)
  const [grimoireRefreshTrigger, setGrimoireRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchCharacters()
    fetchSpells()
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

  const fetchSpells = async () => {
    setSpellsLoading(true)
    try {
      const response = await fetch('/api/spells')
      const data = await response.json()
      setSpells(data.spells || [])
    } catch (error) {
      console.error('Failed to fetch spells:', error)
      setSpells([])
    } finally {
      setSpellsLoading(false)
    }
  }

  const handleAddCharacter = async (characterData: Omit<Character, 'id'>) => {
    setCharacterFormLoading(true)
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      })

      if (!response.ok) {
        throw new Error('Failed to create character')
      }

      const newCharacter = await response.json()
      setCharacters(prev => [...prev, newCharacter])
      setShowAddModal(false)
      setSelectedCharacter(newCharacter)
    } catch (error) {
      console.error('Failed to create character:', error)
      throw error
    } finally {
      setCharacterFormLoading(false)
    }
  }

  const handleEditCharacter = async (characterData: Omit<Character, 'id'>) => {
    if (!selectedCharacter) return

    setCharacterFormLoading(true)
    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      })

      if (!response.ok) {
        throw new Error('Failed to update character')
      }

      const updatedCharacter = await response.json()
      setCharacters(prev => prev.map(char =>
        char.id === updatedCharacter.id ? updatedCharacter : char
      ))
      setShowEditModal(false)
      setSelectedCharacter(updatedCharacter)
    } catch (error) {
      console.error('Failed to update character:', error)
      throw error
    } finally {
      setCharacterFormLoading(false)
    }
  }

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete character')
      }

      setCharacters(prev => prev.filter(char => char.id !== selectedCharacter.id))
      setShowDeleteModal(false)
      setSelectedCharacter(null)
    } catch (error) {
      console.error('Failed to delete character:', error)
      throw error
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddSpell = async (spellData: Omit<Spell, 'id'>) => {
    setSpellFormLoading(true)
    try {
      const response = await fetch('/api/spells', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spellData),
      })

      if (!response.ok) {
        throw new Error('Failed to create spell')
      }

      const newSpell = await response.json()
      setSpells(prev => [...prev, newSpell])
      setShowAddSpellModal(false)
      setSelectedSpell(newSpell)
    } catch (error) {
      console.error('Failed to create spell:', error)
      throw error
    } finally {
      setSpellFormLoading(false)
    }
  }

  const handleEditSpell = async (spellData: Omit<Spell, 'id'>) => {
    if (!selectedSpell) return

    setSpellFormLoading(true)
    try {
      const response = await fetch(`/api/spells/${selectedSpell.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spellData),
      })

      if (!response.ok) {
        throw new Error('Failed to update spell')
      }

      const updatedSpell = await response.json()
      setSpells(prev => prev.map(spell =>
        spell.id === updatedSpell.id ? updatedSpell : spell
      ))
      setShowEditSpellModal(false)
      setSelectedSpell(updatedSpell)
    } catch (error) {
      console.error('Failed to update spell:', error)
      throw error
    } finally {
      setSpellFormLoading(false)
    }
  }

  const handleDeleteSpell = async () => {
    if (!selectedSpell) return

    setDeleteSpellLoading(true)
    try {
      const response = await fetch(`/api/spells/${selectedSpell.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete spell')
      }

      setSpells(prev => prev.filter(spell => spell.id !== selectedSpell.id))
      setShowDeleteSpellModal(false)
      setSelectedSpell(null)
    } catch (error) {
      console.error('Failed to delete spell:', error)
      throw error
    } finally {
      setDeleteSpellLoading(false)
    }
  }

  const handleUpdateSpell = async (updatedSpell: Spell) => {
    try {
      const response = await fetch(`/api/spells/${updatedSpell.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSpell),
      })

      if (!response.ok) {
        throw new Error('Failed to update spell')
      }

      const result = await response.json()
      setSpells(prev => prev.map(spell =>
        spell.id === result.id ? result : spell
      ))

      if (selectedSpell?.id === result.id) {
        setSelectedSpell(result)
      }
    } catch (error) {
      console.error('Failed to update spell:', error)
      setNotification({
        message: 'Failed to update spell',
        type: 'error'
      })
    }
  }

  const handleAddSpellToCharacter = async (spellId: string) => {
    if (!selectedCharacter) return

    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}/spells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spellId }),
      })

      if (response.status === 409) {
        setNotification({
          message: `${selectedCharacter.name} already knows this spell!`,
          type: 'warning'
        })
        return
      }

      if (!response.ok) {
        throw new Error('Failed to add spell to character')
      }

      // Refresh character data and grimoire
      fetchCharacters()
      setGrimoireRefreshTrigger(prev => prev + 1)
      setNotification({
        message: `Spell added to ${selectedCharacter.name}'s grimoire!`,
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to add spell to character:', error)
      setNotification({
        message: 'Failed to add spell to character',
        type: 'error'
      })
    }
  }

  const handleRemoveSpellFromCharacter = async (spellId: string) => {
    if (!selectedCharacter) return

    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}/spells/${spellId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove spell from character')
      }

      // Refresh character data and grimoire
      fetchCharacters()
      setGrimoireRefreshTrigger(prev => prev + 1)
      setNotification({
        message: `Spell removed from ${selectedCharacter.name}'s grimoire`,
        type: 'info'
      })
    } catch (error) {
      console.error('Failed to remove spell from character:', error)
      setNotification({
        message: 'Failed to remove spell from character',
        type: 'error'
      })
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar
        characters={characters}
        selectedCharacter={selectedCharacter}
        onCharacterSelect={setSelectedCharacter}
        onCharactersChange={fetchCharacters}
        onAddCharacter={() => setShowAddModal(true)}
        onEditCharacter={() => setShowEditModal(true)}
        onDeleteCharacter={() => setShowDeleteModal(true)}
        loading={loading}
      />
      <MainContent
        selectedCharacter={selectedCharacter}
        onAddSpellToCharacter={handleAddSpellToCharacter}
        onRemoveSpellFromCharacter={handleRemoveSpellFromCharacter}
        refreshTrigger={grimoireRefreshTrigger}
      />
      <SpellSidebar
        spells={spells}
        selectedSpell={selectedSpell}
        onSpellSelect={setSelectedSpell}
        onSpellsChange={fetchSpells}
        onAddSpell={() => setShowAddSpellModal(true)}
        onEditSpell={() => setShowEditSpellModal(true)}
        onDeleteSpell={() => setShowDeleteSpellModal(true)}
        onAddSpellToCharacter={(spell) => handleAddSpellToCharacter(spell.id)}
        hasSelectedCharacter={!!selectedCharacter}
        loading={spellsLoading}
        onUpdateSpell={handleUpdateSpell}
      />

      {/* Add Character Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Character"
      >
        <CharacterForm
          onSave={handleAddCharacter}
          onCancel={() => setShowAddModal(false)}
          loading={characterFormLoading}
          mode="create"
        />
      </Modal>

      {/* Edit Character Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Character"
      >
        <CharacterForm
          onSave={handleEditCharacter}
          onCancel={() => setShowEditModal(false)}
          loading={characterFormLoading}
          initialData={selectedCharacter ? {
            name: selectedCharacter.name,
            convocations: selectedCharacter.convocations,
            rank: selectedCharacter.rank,
            game: selectedCharacter.game
          } : undefined}
          mode="edit"
        />
      </Modal>

      {/* Delete Character Modal */}
      {selectedCharacter && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Character"
        >
          <DeleteCharacterDialog
            character={selectedCharacter}
            onDelete={handleDeleteCharacter}
            onCancel={() => setShowDeleteModal(false)}
            loading={deleteLoading}
          />
        </Modal>
      )}

      {/* Add Spell Modal */}
      <Modal
        isOpen={showAddSpellModal}
        onClose={() => setShowAddSpellModal(false)}
        title="Add New Spell"
      >
        <SpellForm
          onSave={handleAddSpell}
          onCancel={() => setShowAddSpellModal(false)}
          loading={spellFormLoading}
          mode="create"
          allSpells={spells}
        />
      </Modal>

      {/* Edit Spell Modal */}
      <Modal
        isOpen={showEditSpellModal}
        onClose={() => setShowEditSpellModal(false)}
        title="Edit Spell"
      >
        <SpellForm
          onSave={handleEditSpell}
          onCancel={() => setShowEditSpellModal(false)}
          loading={spellFormLoading}
          initialData={selectedSpell ? {
            name: selectedSpell.name,
            convocation: selectedSpell.convocation,
            complexityLevel: selectedSpell.complexityLevel,
            description: selectedSpell.description,
            bonusEffects: selectedSpell.bonusEffects,
            castingTime: selectedSpell.castingTime,
            range: selectedSpell.range,
            duration: selectedSpell.duration,
            folderPath: selectedSpell.folderPath,
            sourceBook: selectedSpell.sourceBook,
            sourcePage: selectedSpell.sourcePage
          } : undefined}
          mode="edit"
          allSpells={spells}
        />
      </Modal>

      {/* Delete Spell Modal */}
      {selectedSpell && (
        <Modal
          isOpen={showDeleteSpellModal}
          onClose={() => setShowDeleteSpellModal(false)}
          title="Delete Spell"
        >
          <DeleteSpellDialog
            spell={selectedSpell}
            onDelete={handleDeleteSpell}
            onCancel={() => setShowDeleteSpellModal(false)}
            loading={deleteSpellLoading}
          />
        </Modal>
      )}

      {/* Notification Banner */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}

export default App
