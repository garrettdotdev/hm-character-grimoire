import { useState } from "react";
import type { Spell } from "@repo/types";
import type { FolderNode } from "../utils/folderTree";
import { SpellListItem } from "./SpellListItem";

interface FolderTreeNodeProps {
  node: FolderNode;
  selectedSpell: Spell | null;
  onSpellSelect: (spell: Spell) => void;
  onToggleFolder: (folderId: number) => void;
  onAddSpellToCharacter?: (spell: Spell) => void;
  hasSelectedCharacter: boolean;
  level: number;
  onCreateFolder?: (parentId: number, folderName: string) => void;
  onRenameFolder?: (folderId: number, newName: string) => void;
  onDeleteFolder?: (folderId: number, name: string) => void;
  onMoveSpell?: (spellId: string, newFolderId: number) => void;
  onMoveFolder?: (folderId: number, newParentId: number | null) => void;
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
  onMoveFolder,
}: FolderTreeNodeProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [isCreatingSubfolder, setIsCreatingSubfolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const indentLevel = level * 16; // 16px per level

  const handleToggle = () => {
    onToggleFolder(node.id);
  };



  const handleFolderDragStart = (e: React.DragEvent) => {
    e.stopPropagation(); // Prevent parent folder drag events
    setIsDragging(true);
    const folderData = {
      id: node.id,
      name: node.name,
      path: node.path,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(folderData));
    e.dataTransfer.setData("text/plain", "folder"); // Type identifier
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFolderDragEnd = () => {
    setIsDragging(false);
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFolderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const dragType = e.dataTransfer.getData("text/plain");
      const dragData = JSON.parse(e.dataTransfer.getData("application/json"));

      if (dragType === "spell" && dragData.id && onMoveSpell) {
        // Moving a spell to this folder
        onMoveSpell(dragData.id, node.id);
      } else if (dragType === "folder" && dragData.id && onMoveFolder) {
        // Moving a folder to this folder
        if (dragData.id !== node.id) {
          onMoveFolder(dragData.id, node.id);
        }
      }
    } catch (error) {
      console.error("Failed to move item:", error);
    }
  };

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== node.name && onRenameFolder) {
      onRenameFolder(node.id, renameValue.trim());
    }
    setIsRenaming(false);
    setRenameValue(node.name);
  };

  const handleCreateSubfolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(node.id, newFolderName.trim());
    }
    setIsCreatingSubfolder(false);
    setNewFolderName("");
  };

  const handleDelete = () => {
    if (onDeleteFolder) {
      onDeleteFolder(node.id, node.name);
    }
    setShowContextMenu(false);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    action: "rename" | "create",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (action === "rename") {
        handleRename();
      } else {
        handleCreateSubfolder();
      }
    } else if (e.key === "Escape") {
      if (action === "rename") {
        setIsRenaming(false);
        setRenameValue(node.name);
      } else {
        setIsCreatingSubfolder(false);
        setNewFolderName("");
      }
    }
  };

  return (
    <div>
      {/* Folder Header (only show for non-root) */}
      {node.path !== "/" && (
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer relative group transition-colors ${
            isDragging ? "opacity-50" : ""
          } ${isDragOver ? "bg-blue-600" : ""}`}
          style={{ paddingLeft: `${indentLevel}px` }}
          draggable={true}
          onDragStart={handleFolderDragStart}
          onDragEnd={handleFolderDragEnd}
          onDragOver={handleFolderDragOver}
          onDragLeave={handleFolderDragLeave}
          onDrop={handleFolderDrop}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowContextMenu(!showContextMenu);
          }}
        >
          {/* Expand/Collapse Icon */}
          <button
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white mr-1"
          >
            {node.children.length > 0 || node.spells.length > 0
              ? node.isExpanded
                ? "▼"
                : "▶"
              : "○"}
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
              onKeyDown={(e) => handleKeyPress(e, "rename")}
              className="bg-gray-600 text-white px-1 py-0 text-sm rounded flex-1"
              autoFocus
            />
          ) : (
            <span className="text-white text-sm font-medium flex-1">
              {node.name}
            </span>
          )}

          {/* Folder Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingSubfolder(true);
              }}
              className="w-5 h-5 text-gray-400 hover:text-green-400 text-xs flex items-center justify-center"
              title="Create subfolder"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(!showContextMenu);
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
                  setIsRenaming(true);
                  setShowContextMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  setIsCreatingSubfolder(true);
                  setShowContextMenu(false);
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
              onKeyDown={(e) => handleKeyPress(e, "create")}
              className="bg-gray-600 text-white px-2 py-1 text-sm rounded flex-1"
              placeholder="Folder name"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Folder Contents (when expanded) */}
      {(node.isExpanded || node.path === "/") && (
        <div>
          {/* Child Folders */}
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.id}
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
          {node.spells.map((spell) => (
            <SpellListItem
              key={spell.id}
              spell={spell}
              selectedSpell={selectedSpell}
              onSpellSelect={onSpellSelect}
              onAddSpellToCharacter={onAddSpellToCharacter}
              hasSelectedCharacter={hasSelectedCharacter}
              onMoveSpell={onMoveSpell}
              indentLevel={indentLevel}
            />
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
  );
}
