import { useState } from 'react'
import type { Spell } from '../types'
import type { FolderNode } from '../utils/folderTree'

interface FolderTreeNodeProps {
  node: FolderNode
  selectedSpell: Spell | null
  onSpellSelect: (spell: Spell) => void
  onToggleFolder: (path: string) => void
  onAddSpellToCharacter?: (spell: Spell) => void
  hasSelectedCharacter: boolean
  level: number
  onCreateFolder?: (parentPath: string, folderName: string) => void
  onRenameFolder?: (path: string, newName: string) => void
  onDeleteFolder?: (path: string) => void
  onMoveSpell?: (spellId: string, newFolderPath: string) => void
  onMoveFolder?: (sourcePath: string, targetParentPath: string) => void
}

export function FolderTreeNode({
  node,
  selectedSpell,
  onSpellSelect,
  onToggleFolder,
  onAddSpellToCharacter,
  hasSelectedCharacter,
  level,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveSpell,
  onMoveFolder
}: FolderTreeNodeProps) {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(node.name)
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const indentLevel = level * 16 // 16px per level

  const handleToggle = () => {
    onToggleFolder(node.path)
  }

  const handleSpellDragStart = (e: React.DragEvent, spell: Spell) => {
    e.dataTransfer.setData('application/json', JSON.stringify(spell))
    e.dataTransfer.setData('text/plain', 'spell') // Type identifier
    // Support both copy (to character) and move (between folders)
    e.dataTransfer.effectAllowed = 'copyMove'
  }

  const handleFolderDragStart = (e: React.DragEvent) => {
    e.stopPropagation() // Prevent parent folder drag events
    setIsDragging(true)
    const folderData = {
      path: node.path,
      name: node.name
    }
    e.dataTransfer.setData('application/json', JSON.stringify(folderData))
    e.dataTransfer.setData('text/plain', 'folder') // Type identifier
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleFolderDragEnd = () => {
    setIsDragging(false)
  }

  const handleFolderDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFolderDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    try {
      const dragType = e.dataTransfer.getData('text/plain')
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))

      if (dragType === 'spell' && dragData.id && onMoveSpell) {
        // Moving a spell to this folder
        onMoveSpell(dragData.id, node.path)
      } else if (dragType === 'folder' && dragData.path && onMoveFolder) {
        // Moving a folder to this folder
        if (dragData.path !== node.path && !node.path.startsWith(dragData.path + '/')) {
          onMoveFolder(dragData.path, node.path)
        }
      }
    } catch (error) {
      console.error('Failed to move item:', error)
    }
  }

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== node.name && onRenameFolder) {
      onRenameFolder(node.path, renameValue.trim())
    }
    setIsRenaming(false)
    setRenameValue(node.name)
  }

  const handleCreateSubfolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(node.path, newFolderName.trim())
    }
    setIsCreatingSubfolder(false)
    setNewFolderName('')
  }

  const handleDelete = () => {
    if (onDeleteFolder && confirm(`Delete folder "${node.name}" and move all spells to parent folder?`)) {
      onDeleteFolder(node.path)
    }
    setShowContextMenu(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: 'rename' | 'create') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (action === 'rename') {
        handleRename()
      } else {
        handleCreateSubfolder()
      }
    } else if (e.key === 'Escape') {
      if (action === 'rename') {
        setIsRenaming(false)
        setRenameValue(node.name)
      } else {
        setIsCreatingSubfolder(false)
        setNewFolderName('')
      }
    }
  }

  return (
    <div>
      {/* Folder Header (only show for non-root) */}
      {node.path !== '/' && (
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer relative group transition-colors ${
            isDragging ? 'opacity-50' : ''
          } ${
            isDragOver ? 'bg-blue-600' : ''
          }`}
          style={{ paddingLeft: `${indentLevel}px` }}
          draggable={true}
          onDragStart={handleFolderDragStart}
          onDragEnd={handleFolderDragEnd}
          onDragOver={handleFolderDragOver}
          onDragLeave={handleFolderDragLeave}
          onDrop={handleFolderDrop}
          onContextMenu={(e) => {
            e.preventDefault()
            setShowContextMenu(!showContextMenu)
          }}
        >
          {/* Expand/Collapse Icon */}
          <button
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white mr-1"
          >
            {node.children.length > 0 || node.spells.length > 0 ? (
              node.isExpanded ? '▼' : '▶'
            ) : (
              '○'
            )}
          </button>

          {/* Folder Icon */}
          <span className="text-yellow-400 mr-2">📁</span>

          {/* Folder Name */}
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => handleKeyPress(e, 'rename')}
              className="bg-gray-600 text-white px-1 py-0 text-sm rounded flex-1"
              autoFocus
            />
          ) : (
            <span className="text-white text-sm font-medium flex-1">{node.name}</span>
          )}

          {/* Folder Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsCreatingSubfolder(true)
              }}
              className="w-5 h-5 text-gray-400 hover:text-green-400 text-xs flex items-center justify-center"
              title="Create subfolder"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowContextMenu(!showContextMenu)
              }}
              className="w-5 h-5 text-gray-400 hover:text-white text-xs flex items-center justify-center"
              title="Folder options"
            >
              ⋮
            </button>
          </div>

          {/* Context Menu */}
          {showContextMenu && (
            <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-20 min-w-32">
              <button
                onClick={() => {
                  setIsRenaming(true)
                  setShowContextMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  setIsCreatingSubfolder(true)
                  setShowContextMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
              >
                New Subfolder
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Subfolder Input */}
      {isCreatingSubfolder && (
        <div
          className="py-1 px-2"
          style={{ paddingLeft: `${indentLevel + 20}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">📁</span>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleCreateSubfolder}
              onKeyDown={(e) => handleKeyPress(e, 'create')}
              className="bg-gray-600 text-white px-2 py-1 text-sm rounded flex-1"
              placeholder="Folder name"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Folder Contents (when expanded) */}
      {(node.isExpanded || node.path === '/') && (
        <div>
          {/* Child Folders */}
          {node.children.map(child => (
            <FolderTreeNode
              key={child.path}
              node={child}
              selectedSpell={selectedSpell}
              onSpellSelect={onSpellSelect}
              onToggleFolder={onToggleFolder}
              onAddSpellToCharacter={onAddSpellToCharacter}
              hasSelectedCharacter={hasSelectedCharacter}
              level={level + 1}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveSpell={onMoveSpell}
              onMoveFolder={onMoveFolder}
            />
          ))}

          {/* Spells in this folder */}
          {node.spells.map(spell => (
            <div
              key={spell.id}
              className={`p-3 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-700 relative group ${
                selectedSpell?.id === spell.id 
                  ? 'bg-gray-700 border-r-4 border-r-blue-500' 
                  : ''
              }`}
              style={{ paddingLeft: `${indentLevel + 20}px` }}
              draggable={true} // Always draggable for both folder moves and character assignment
              onDragStart={(e) => handleSpellDragStart(e, spell)}
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
          ))}
        </div>
      )}

      {/* Click outside to close context menu */}
      {showContextMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowContextMenu(false)}
        />
      )}
    </div>
  )
}
