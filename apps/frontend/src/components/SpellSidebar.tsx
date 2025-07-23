import { useState, useMemo, useRef } from "react";
import type { Spell, FolderWithPath } from "@repo/types";
import { FolderTreeNode } from "./FolderTreeNode";
import { buildFolderTree, type FolderTreeState } from "../utils/folderTree";
import { AddContextMenu } from "./AddContextMenu";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { useFolderStore } from "../stores/folderStore";

interface SpellSidebarProps {
  spells: Spell[];
  folders: FolderWithPath[];
  selectedSpell: Spell | null;
  onSpellSelect: (spell: Spell) => void;
  onSpellsChange: () => void;
  onAddSpell: () => void;
  onAddFolder: () => void;
  onEditSpell: () => void;
  onDeleteSpell: () => void;
  onImportSpells: () => void;
  onAddSpellToCharacter?: (spell: Spell) => void;
  hasSelectedCharacter: boolean;
  loading: boolean;
  onUpdateSpell?: (spell: Spell) => void; // For moving spells between folders
}

export function SpellSidebar({
  spells,
  folders,
  selectedSpell,
  onSpellSelect,
  onSpellsChange,
  onAddSpell,
  onAddFolder,
  onEditSpell,
  onDeleteSpell,
  onImportSpells,
  onAddSpellToCharacter,
  hasSelectedCharacter,
  loading,
  onUpdateSpell,
}: SpellSidebarProps) {
  const { deleteFolder, renameFolder } = useFolderStore();
  const [expandedFolders, setExpandedFolders] = useState<FolderTreeState>({
    1: true, // Root folder (ID=1) is always expanded
  });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ folderId: number; name: string } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // No need to fetch empty folders separately - they're included in the folders prop // Refetch when spells change

  // Build the folder tree from normalized folder data and spells
  const folderTree = useMemo(() => {
    if (folders.length === 0) {
      // Return a minimal root node if no folders are loaded yet
      return {
        id: 1,
        name: "",
        path: "/",
        parentId: null,
        children: [],
        spells: [],
        isExpanded: true,
      };
    }
    return buildFolderTree(folders, spells, expandedFolders);
  }, [folders, spells, expandedFolders]);

  const handleToggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleMoveSpell = async (spellId: string, newFolderId: number) => {
    const spell = spells.find((s) => s.id === spellId);
    if (!spell || !onUpdateSpell) return;

    const updatedSpell = { ...spell, folderId: newFolderId };
    onUpdateSpell(updatedSpell);
  };

  const handleMoveFolder = async (folderId: number, newParentId: number | null) => {
    try {
      const response = await fetch("/api/folders/move", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId, newParentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to move folder");
      }

      // Refresh the spell list to pick up the moved folder
      onSpellsChange();
    } catch (error) {
      console.error("Failed to move folder:", error);
    }
  };

  const handleCreateFolder = async (parentId: number, folderName: string) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: folderName, parentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      const result = await response.json();

      // Expand the parent folder and the new folder
      setExpandedFolders((prev) => ({
        ...prev,
        [parentId]: true,
        [result.folderId]: true,
      }));

      // Refresh the spell list to pick up the new folder
      onSpellsChange();
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleRenameFolder = async (folderId: number, newName: string) => {
    try {
      // Use the folder store instead of direct fetch
      await renameFolder(folderId, newName);

      // Refresh the spell list to pick up the renamed folder
      onSpellsChange();
    } catch (error) {
      console.error("Failed to rename folder:", error);
    }
  };

  const handleDeleteFolder = async (folderId: number, name: string) => {
    setFolderToDelete({ folderId, name });
  };

  const handleConfirmDeleteFolder = async (strategy: 'move-to-parent' | 'recursive') => {
    if (!folderToDelete) return;

    try {
      setDeletingFolder(true);

      // Use the folder store instead of direct fetch
      await deleteFolder(folderToDelete.folderId, strategy);

      // Refresh the spell list to pick up the changes
      onSpellsChange();
      setFolderToDelete(null);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      throw error; // Re-throw to let the dialog handle the error
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleCancelDeleteFolder = () => {
    setFolderToDelete(null);
  };


  return (
    <div className="w-80 flex-shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center h-[76px]">
        <div className="flex gap-2 relative">
          <button
            ref={addButtonRef}
            onClick={() => setShowContextMenu(!showContextMenu)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
            title="Add Spell or Folder"
          >
            +
          </button>
          <AddContextMenu
            isOpen={showContextMenu}
            onClose={() => setShowContextMenu(false)}
            onAddSpell={onAddSpell}
            onAddFolder={onAddFolder}
            buttonRef={addButtonRef}
          />
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
            onMoveFolder={handleMoveFolder}
          />
        )}
      </div>

      {/* Delete Folder Dialog */}
      {folderToDelete && (
        <DeleteFolderDialog
          folderId={folderToDelete.folderId}
          folderName={folderToDelete.name}
          onDelete={handleConfirmDeleteFolder}
          onCancel={handleCancelDeleteFolder}
          loading={deletingFolder}
        />
      )}
    </div>
  );
}
