import { useState, useMemo, useRef, useEffect } from "react";
import type { Spell, FolderWithPath } from "@repo/types";
import { FolderTreeNode } from "./FolderTreeNode";
import { SpellListItem } from "./SpellListItem";
import { buildFolderTree, type FolderTreeState } from "../utils/folderTree";
import { AddContextMenu } from "./AddContextMenu";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { useFolderStore } from "../stores/folderStore";
import { useSpellStore } from "../stores/spellStore";

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
  onViewSpellDetails: () => void;
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
  onViewSpellDetails,
  onImportSpells,
  onAddSpellToCharacter,
  hasSelectedCharacter,
  loading,
  onUpdateSpell: _onUpdateSpell, // Prefix with underscore to indicate intentionally unused
}: SpellSidebarProps) {
  const { deleteFolder, renameFolder, moveFolder } = useFolderStore();
  const { moveSpell } = useSpellStore();
  const [expandedFolders, setExpandedFolders] = useState<FolderTreeState>({
    1: true, // Root folder (ID=1) is always expanded
  });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ folderId: number; name: string } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSpells, setFilteredSpells] = useState<Spell[]>(spells);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Filter spells based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSpells(spells);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = spells
        .filter(
          (spell) => {
            // Search in basic fields
            const basicMatch =
              spell.name.toLowerCase().includes(searchLower) ||
              spell.description.toLowerCase().includes(searchLower) ||
              spell.castingTime.toLowerCase().includes(searchLower) ||
              spell.range.toLowerCase().includes(searchLower) ||
              spell.duration.toLowerCase().includes(searchLower) ||
              spell.sourceBook.toLowerCase().includes(searchLower) ||
              spell.sourcePage.toLowerCase().includes(searchLower);

            // Search in bonus effects
            const bonusEffectsMatch = spell.bonusEffects.some(effect =>
              effect.effectsDescription.toLowerCase().includes(searchLower)
            );

            return basicMatch || bonusEffectsMatch;
          }
        )
        .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical sorting for search results
      setFilteredSpells(filtered);
    }
  }, [spells, searchTerm]);

  // Build the folder tree from normalized folder data and filtered spells
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
    return buildFolderTree(folders, filteredSpells, expandedFolders);
  }, [folders, filteredSpells, expandedFolders]);

  const handleToggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleMoveSpell = async (spellId: string, newFolderId: number) => {
    try {
      console.log("Moving spell:", spellId, "to folder:", newFolderId);

      // Use the spell store to move the spell (this auto-updates the spell list)
      await moveSpell(spellId, newFolderId);

      console.log("Successfully moved spell");
      // Refresh the spell list to pick up any changes
      onSpellsChange();
    } catch (error) {
      console.error("Failed to move spell:", error);
    }
  };

  const handleMoveFolder = async (folderId: number, newParentId: number | null) => {
    try {
      console.log("Moving folder:", folderId, "to parent:", newParentId);

      // Use the folder store instead of direct fetch (this auto-refreshes folders)
      await moveFolder(folderId, newParentId);

      console.log("Successfully moved folder");
      // Refresh the spell list to pick up any changes
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
    <div className="min-w-80 w-fit flex-shrink-0 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center h-[76px]">
        <div className="flex gap-2 relative whitespace-nowrap">
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
            onClick={onViewSpellDetails}
            disabled={!selectedSpell}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
            title={selectedSpell ? "View Spell Details" : "Select a spell to view details"}
          >
            👁️
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
        ) : filteredSpells.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-400 italic">
            {searchTerm ? "No spells match your search" : "No spells found"}
          </div>
        ) : searchTerm ? (
          // Flat list when searching
          <div>
            {filteredSpells.map((spell) => (
              <SpellListItem
                key={spell.id}
                spell={spell}
                selectedSpell={selectedSpell}
                onSpellSelect={onSpellSelect}
                onViewSpellDetails={onViewSpellDetails}
                onAddSpellToCharacter={onAddSpellToCharacter}
                hasSelectedCharacter={hasSelectedCharacter}
                onMoveSpell={handleMoveSpell}
                indentLevel={0} // No indentation for flat list
              />
            ))}
          </div>
        ) : (
          // Folder tree when not searching
          <FolderTreeNode
            node={folderTree}
            selectedSpell={selectedSpell}
            onSpellSelect={onSpellSelect}
            onViewSpellDetails={onViewSpellDetails}
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

      {/* Footer with search */}
      <div className="p-4 border-t border-gray-700 flex justify-between items-center h-[76px]">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
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
