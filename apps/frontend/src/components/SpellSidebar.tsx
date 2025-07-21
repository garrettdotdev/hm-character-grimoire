import {useState, useMemo, useEffect} from 'react'
import type { Spell } from '../types'
import { FolderTreeNode } from './FolderTreeNode'
import { buildFolderTree, type FolderTreeState } from '../utils/folderTree'

interface SpellSidebarProps {
  spells: Spell[]
  selectedSpell: Spell | null
  onSpellSelect: (spell: Spell) => void
  onSpellsChange: () => void
  onAddSpell: () => void
  onEditSpell: () => void
  onDeleteSpell: () => void
  onImportSpells: () => void
  onAddSpellToCharacter?: (spell: Spell) => void
  hasSelectedCharacter: boolean
  loading: boolean
  onUpdateSpell?: (spell: Spell) => void // For moving spells between folders
}

export function SpellSidebar({
  spells,
  selectedSpell,
  onSpellSelect,
  onSpellsChange,
  onAddSpell,
  onEditSpell,
  onDeleteSpell,
  onImportSpells,
  onAddSpellToCharacter,
  hasSelectedCharacter,
  loading,
  onUpdateSpell
}: SpellSidebarProps) {

  const [expandedFolders, setExpandedFolders] = useState<FolderTreeState>({
    '/': true // Root is always expanded
  })
  const [emptyFolders, setEmptyFolders] = useState<string[]>([])

  // Fetch empty folders
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/folders')
        const data = await response.json()
        setEmptyFolders(data.folders || [])
      } catch (error) {
        console.error('Failed to fetch folders:', error)
      }
    }

    fetchFolders()
  }, [spells]) // Refetch when spells change

  // Build the folder tree from spells and empty folders
  const folderTree = useMemo(() => {
    return buildFolderTree(spells, expandedFolders, emptyFolders)
  }, [spells, expandedFolders, emptyFolders])

  const handleToggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }))
  }

  const handleMoveSpell = async (spellId: string, newFolderPath: string) => {
    const spell = spells.find(s => s.id === spellId)
    if (!spell || !onUpdateSpell) return

    const updatedSpell = { ...spell, folderPath: newFolderPath }
    onUpdateSpell(updatedSpell)
  }

  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    try {
      const newFolderPath = parentPath === '/' ? `/${folderName}` : `${parentPath}/${folderName}`

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath: newFolderPath }),
      })

      if (!response.ok) {
        throw new Error('Failed to create folder')
      }

      // Expand the parent folder and the new folder
      setExpandedFolders(prev => ({
        ...prev,
        [parentPath]: true,
        [newFolderPath]: true
      }))

      // Refresh the spell list to pick up the new folder
      onSpellsChange()
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const handleRenameFolder = async (oldPath: string, newName: string) => {
    // This would require updating all spells in this folder and subfolders
    // For now, we'll implement this as a batch update
    console.log('Rename folder:', oldPath, 'to', newName)
    try {
      const newPath = oldPath.replace(/\/[^/]*$/, `/${newName}`)

      const response = await fetch('/api/folders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPath, newPath }),
      })

      if (!response.ok) {
        throw new Error('Failed to rename folder')
      }

      // Refresh the spell list to pick up the new folder
      onSpellsChange()
    } catch (error) {
      console.error('Failed to rename folder:', error)
    }
  }

  const handleDeleteFolder = async (path: string) => {
    // This would move all spells to the parent folder
    console.log('Delete folder:', path)
    try {
    const response = await fetch('/api/folders', {
    method: 'DELETE',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folderPath: path }),
    })

    if (!response.ok) {
      throw new Error('Failed to delete folder')
    }

    // Refresh the spell list to pick up the new folder
    onSpellsChange()
    } catch (error) {
        console.error('Failed to delete folder:', error)
    }
  }

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
          <button
            onClick={onImportSpells}
            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors"
            title="Import Spells from JSON"
          >
            📥
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
          <FolderTreeNode
            node={folderTree}
            selectedSpell={selectedSpell}
            onSpellSelect={onSpellSelect}
            onToggleFolder={handleToggleFolder}
            onAddSpellToCharacter={onAddSpellToCharacter}
            hasSelectedCharacter={hasSelectedCharacter}
            level={0}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveSpell={handleMoveSpell}
          />
        )}
      </div>
    </div>
  )
}
