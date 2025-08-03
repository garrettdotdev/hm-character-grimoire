import { useState, useRef, useEffect, useMemo } from "react";
import type { Spell } from "@repo/types";
import { Sidebar } from "../components/Sidebar.js";
import { MainContent } from "../components/MainContent.js";
import { SpellSidebar } from "../components/SpellSidebar.js";
import { Modal } from "../components/Modal.js";
import { ProtectedModal } from "../components/ProtectedModal.js";
import { CharacterForm } from "../components/AddCharacterForm.js";
import { DeleteCharacterDialog } from "../components/DeleteCharacterDialog.js";
import { SpellForm } from "../components/SpellForm.js";
import { DeleteSpellDialog } from "../components/DeleteSpellDialog.js";
import { SpellImportModal } from "../components/SpellImportModal.js";
import { AddFolderModal, type AddFolderModalRef } from "../components/AddFolderModal.js";
import { ErrorTestModal } from "../components/ErrorTestModal.js";
import { useCharacters } from "../hooks/useCharacters.js";
import { useSpells } from "../hooks/useSpells.js";
import { useFolderStore } from "../stores/folderStore.js";

export function GrimoirePage() {
  const { characters, selectedCharacter, loading: charactersLoading, actions: characterActions } = useCharacters();
  const { spells, selectedSpell, loading: spellsLoading, actions: spellActions } = useSpells();
  const { folders, hasAttemptedFetch, fetchFolders, createFolder } = useFolderStore();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddSpellModal, setShowAddSpellModal] = useState(false);
  const [showEditSpellModal, setShowEditSpellModal] = useState(false);
  const [showDeleteSpellModal, setShowDeleteSpellModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showErrorTestModal, setShowErrorTestModal] = useState(false);

  // Form loading states
  const [characterFormLoading, setCharacterFormLoading] = useState(false);
  const [spellFormLoading, setSpellFormLoading] = useState(false);

  // Form dirty states
  const [addCharacterDirty, setAddCharacterDirty] = useState(false);
  const [editCharacterDirty, setEditCharacterDirty] = useState(false);
  const [addSpellDirty, setAddSpellDirty] = useState(false);
  const [editSpellDirty, setEditSpellDirty] = useState(false);
  const [addFolderDirty, setAddFolderDirty] = useState(false);
  const [importSpellsDirty, setImportSpellsDirty] = useState(false);

  // Refresh trigger for character spells
  const [grimoireRefreshTrigger, setGrimoireRefreshTrigger] = useState(0);

  // Refs for form components
  const addFolderModalRef = useRef<AddFolderModalRef>(null);

  // Fetch folders on component mount (only if we haven't tried yet)
  useEffect(() => {
    if (!hasAttemptedFetch) {
      fetchFolders();
    }
  }, [hasAttemptedFetch]); // Only fetch if we haven't attempted yet

  // Wrapper for updateSpell to match expected signature
  const handleUpdateSpell = (spell: Spell) => {
    spellActions.updateSpell(spell.id, spell);
  };

  const handleAddCharacter = async (characterData: any) => {
    setCharacterFormLoading(true);
    try {
      const newCharacter = await characterActions.createCharacter(characterData);
      setShowAddModal(false);
      characterActions.selectCharacter(newCharacter);
    } catch (error) {
      console.error("Failed to create character:", error);
      throw error;
    } finally {
      setCharacterFormLoading(false);
    }
  };

  const handleEditCharacter = async (characterData: any) => {
    if (!selectedCharacter) return;
    
    setCharacterFormLoading(true);
    try {
      await characterActions.updateCharacter(selectedCharacter.id, characterData);
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update character:", error);
      throw error;
    } finally {
      setCharacterFormLoading(false);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;
    
    try {
      await characterActions.deleteCharacter(selectedCharacter.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete character:", error);
    }
  };

  const handleAddSpell = async (spellData: any) => {
    setSpellFormLoading(true);
    try {
      const newSpell = await spellActions.createSpell(spellData);
      setShowAddSpellModal(false);
      spellActions.selectSpell(newSpell);
    } catch (error) {
      console.error("Failed to create spell:", error);
      throw error;
    } finally {
      setSpellFormLoading(false);
    }
  };

  const handleEditSpell = async (spellData: any) => {
    if (!selectedSpell) return;
    
    setSpellFormLoading(true);
    try {
      await spellActions.updateSpell(selectedSpell.id, spellData);
      setShowEditSpellModal(false);
    } catch (error) {
      console.error("Failed to update spell:", error);
      throw error;
    } finally {
      setSpellFormLoading(false);
    }
  };

  const handleDeleteSpell = async () => {
    if (!selectedSpell) return;
    
    try {
      await spellActions.deleteSpell(selectedSpell.id);
      setShowDeleteSpellModal(false);
    } catch (error) {
      console.error("Failed to delete spell:", error);
    }
  };

  const handleAddSpellToCharacter = async (spell: any) => {
    if (!selectedCharacter) return;

    const spellId = typeof spell === 'string' ? spell : spell.id;
    try {
      await characterActions.addSpellToCharacter(selectedCharacter.id, spellId);
      setGrimoireRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to add spell to character:", error);
    }
  };

  const handleRemoveSpellFromCharacter = async (spellId: string) => {
    if (!selectedCharacter) return;
    
    try {
      await characterActions.removeSpellFromCharacter(selectedCharacter.id, spellId);
      setGrimoireRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to remove spell from character:", error);
    }
  };

  const handleImportSpells = async (spells: any[]) => {
    try {
      await spellActions.importSpells(spells);
      setShowImportModal(false);
    } catch (error) {
      console.error("Failed to import spells:", error);
      throw error;
    }
  };

  const editCharacterInitialData = selectedCharacter ? {
    name: selectedCharacter.name,
    convocations: selectedCharacter.convocations,
    rank: selectedCharacter.rank,
    game: selectedCharacter.game,
  } : undefined;

  const editSpellInitialData = useMemo(() => {
    return selectedSpell ? {
      name: selectedSpell.name,
      convocation: selectedSpell.convocation,
      complexityLevel: selectedSpell.complexityLevel,
      description: selectedSpell.description,
      bonusEffects: selectedSpell.bonusEffects,
      castingTime: selectedSpell.castingTime,
      range: selectedSpell.range,
      duration: selectedSpell.duration,
      folderId: selectedSpell.folderId,
      sourceBook: selectedSpell.sourceBook,
      sourcePage: selectedSpell.sourcePage,
    } : undefined;
  }, [selectedSpell]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar
        characters={characters}
        selectedCharacter={selectedCharacter}
        onCharacterSelect={characterActions.selectCharacter}
        onCharactersChange={characterActions.fetchCharacters}
        onAddCharacter={() => setShowAddModal(true)}
        onEditCharacter={() => setShowEditModal(true)}
        onDeleteCharacter={() => setShowDeleteModal(true)}
        loading={charactersLoading}
      />
      <MainContent
        selectedCharacter={selectedCharacter}
        onAddSpellToCharacter={handleAddSpellToCharacter}
        onRemoveSpellFromCharacter={handleRemoveSpellFromCharacter}
        refreshTrigger={grimoireRefreshTrigger}
      />
      <SpellSidebar
        spells={spells}
        folders={folders}
        selectedSpell={selectedSpell}
        onSpellSelect={spellActions.selectSpell}
        onSpellsChange={spellActions.fetchSpells}
        onAddSpell={() => setShowAddSpellModal(true)}
        onAddFolder={() => setShowAddFolderModal(true)}
        onEditSpell={() => setShowEditSpellModal(true)}
        onDeleteSpell={() => setShowDeleteSpellModal(true)}
        onImportSpells={() => setShowImportModal(true)}
        onAddSpellToCharacter={handleAddSpellToCharacter}
        hasSelectedCharacter={!!selectedCharacter}
        loading={spellsLoading}
        onUpdateSpell={handleUpdateSpell}
      />

      {/* Character Modals */}
      {showAddModal && (
        <ProtectedModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Character"
          isDirty={addCharacterDirty}
          canSave={addCharacterDirty}
        >
          <CharacterForm
            onSave={handleAddCharacter}
            onCancel={() => setShowAddModal(false)}
            loading={characterFormLoading}
            mode="create"
            onDirtyChange={setAddCharacterDirty}
          />
        </ProtectedModal>
      )}

      {showEditModal && selectedCharacter && (
        <ProtectedModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Character"
          isDirty={editCharacterDirty}
          canSave={editCharacterDirty}
        >
          <CharacterForm
            onSave={handleEditCharacter}
            onCancel={() => setShowEditModal(false)}
            loading={characterFormLoading}
            initialData={editCharacterInitialData}
            mode="edit"
            onDirtyChange={setEditCharacterDirty}
          />
        </ProtectedModal>
      )}

      {showDeleteModal && selectedCharacter && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Character">
          <DeleteCharacterDialog
            character={selectedCharacter}
            onDelete={handleDeleteCharacter}
            onCancel={() => setShowDeleteModal(false)}
          />
        </Modal>
      )}

      {/* Spell Modals */}
      {showAddSpellModal && (
        <ProtectedModal
          isOpen={showAddSpellModal}
          onClose={() => setShowAddSpellModal(false)}
          title="Add Spell"
          size="xl"
          isDirty={addSpellDirty}
          canSave={addSpellDirty}
        >
          <SpellForm
            onSave={handleAddSpell}
            onCancel={() => setShowAddSpellModal(false)}
            loading={spellFormLoading}
            mode="create"
            onDirtyChange={setAddSpellDirty}
            folders={folders}
          />
        </ProtectedModal>
      )}

      {showEditSpellModal && selectedSpell && (
        <ProtectedModal
          isOpen={showEditSpellModal}
          onClose={() => setShowEditSpellModal(false)}
          title="Edit Spell"
          size="xl"
          isDirty={editSpellDirty}
          onSave={async () => {
            // The actual save will be handled by the SpellForm component
            // This is just for the modal's save button
          }}
          canSave={editSpellDirty}
        >
          <SpellForm
            onSave={handleEditSpell}
            onCancel={() => setShowEditSpellModal(false)}
            loading={spellFormLoading}
            initialData={editSpellInitialData}
            mode="edit"
            onDirtyChange={setEditSpellDirty}
            folders={folders}
          />
        </ProtectedModal>
      )}

      {showDeleteSpellModal && selectedSpell && (
        <Modal isOpen={showDeleteSpellModal} onClose={() => setShowDeleteSpellModal(false)} title="Delete Spell">
          <DeleteSpellDialog
            spell={selectedSpell}
            onDelete={handleDeleteSpell}
            onCancel={() => setShowDeleteSpellModal(false)}
          />
        </Modal>
      )}

      {showImportModal && (
        <ProtectedModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Spells"
          isDirty={importSpellsDirty}
          onSave={async () => {
            // For import modal, we don't have a separate save action
            // The import action itself is the save
          }}
          canSave={false} // Import modal doesn't have a separate save action
        >
          <SpellImportModal
            onImport={handleImportSpells}
            onCancel={() => setShowImportModal(false)}
            onDirtyChange={setImportSpellsDirty}
          />
        </ProtectedModal>
      )}

      {showAddFolderModal && (
        <ProtectedModal
          isOpen={showAddFolderModal}
          onClose={() => setShowAddFolderModal(false)}
          title="Add Folder"
          isDirty={addFolderDirty}
          onSave={async () => {
            if (addFolderModalRef.current) {
              await addFolderModalRef.current.save();
            }
          }}
          canSave={addFolderDirty}
        >
          <AddFolderModal
            ref={addFolderModalRef}
            onSave={async (name: string, parentId: number) => {
              await createFolder(name, parentId);
              await fetchFolders();
              await spellActions.fetchSpells();
              setShowAddFolderModal(false);
            }}
            onCancel={() => setShowAddFolderModal(false)}
            allFolders={folders}
            onDirtyChange={setAddFolderDirty}
          />
        </ProtectedModal>
      )}

      {/* Error Test Modal (Development Only) */}
      {import.meta.env.DEV && (
        <>
          <button
            onClick={() => setShowErrorTestModal(true)}
            className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-40"
            title="Test Error Handling (Dev Only)"
          >
            🧪 Test Errors
          </button>

          <ErrorTestModal
            isOpen={showErrorTestModal}
            onClose={() => setShowErrorTestModal(false)}
          />
        </>
      )}
    </div>
  );
}
