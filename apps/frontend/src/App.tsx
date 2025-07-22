import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { SpellSidebar } from "./components/SpellSidebar";
import { Modal } from "./components/Modal";
import { ProtectedModal } from "./components/ProtectedModal";
import { CharacterForm } from "./components/AddCharacterForm";
import { DeleteCharacterDialog } from "./components/DeleteCharacterDialog";
import { SpellForm } from "./components/SpellForm";
import { DeleteSpellDialog } from "./components/DeleteSpellDialog";
import { SpellImportModal } from "./components/SpellImportModal";
import { AddFolderModal } from "./components/AddFolderModal";
import { NotificationBanner } from "./components/NotificationBanner";
import type { Character, Spell } from "./types";
import "./App.css";

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [spells, setSpells] = useState<Spell[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [loading, setLoading] = useState(false);
  const [spellsLoading, setSpellsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddSpellModal, setShowAddSpellModal] = useState(false);
  const [showEditSpellModal, setShowEditSpellModal] = useState(false);
  const [showDeleteSpellModal, setShowDeleteSpellModal] = useState(false);
  const [showImportSpellModal, setShowImportSpellModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [characterFormLoading, setCharacterFormLoading] = useState(false);
  const [spellFormLoading, setSpellFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSpellLoading, setDeleteSpellLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [folderFormLoading, setFolderFormLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "warning" | "error" | "success";
  } | null>(null);

  // Dirty state tracking for forms
  const [isCharacterFormDirty, setIsCharacterFormDirty] = useState(false);
  const [isSpellFormDirty, setIsSpellFormDirty] = useState(false);

  // Reset dirty state when modals close
  const handleCloseAddCharacterModal = () => {
    setShowAddModal(false);
    setIsCharacterFormDirty(false);
  };

  const handleCloseEditCharacterModal = () => {
    setShowEditModal(false);
    setIsCharacterFormDirty(false);
  };

  const handleCloseAddSpellModal = () => {
    setShowAddSpellModal(false);
    setIsSpellFormDirty(false);
  };

  const handleCloseEditSpellModal = () => {
    setShowEditSpellModal(false);
    setIsSpellFormDirty(false);
  };

  // Memoize initial data to prevent unnecessary re-renders
  const editSpellInitialData = useMemo(() => {
    if (!selectedSpell) return undefined;
    return {
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
      sourcePage: selectedSpell.sourcePage,
    };
  }, [selectedSpell]);

  const editCharacterInitialData = useMemo(() => {
    if (!selectedCharacter) return undefined;
    return {
      name: selectedCharacter.name,
      convocations: selectedCharacter.convocations,
      rank: selectedCharacter.rank,
      game: selectedCharacter.game,
    };
  }, [selectedCharacter]);
  const [grimoireRefreshTrigger, setGrimoireRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchCharacters();
    fetchSpells();
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/characters");
      const data = await response.json();
      setCharacters(data.characters || []);
    } catch (error) {
      console.error("Failed to fetch characters:", error);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpells = async () => {
    setSpellsLoading(true);
    try {
      const response = await fetch("/api/spells");
      const data = await response.json();
      setSpells(data.spells || []);
    } catch (error) {
      console.error("Failed to fetch spells:", error);
      setSpells([]);
    } finally {
      setSpellsLoading(false);
    }
  };

  const handleAddCharacter = async (characterData: Omit<Character, "id">) => {
    setCharacterFormLoading(true);
    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        throw new Error("Failed to create character");
      }

      const newCharacter = await response.json();
      setCharacters((prev) => [...prev, newCharacter]);
      setShowAddModal(false);
      setSelectedCharacter(newCharacter);
    } catch (error) {
      console.error("Failed to create character:", error);
      throw error;
    } finally {
      setCharacterFormLoading(false);
    }
  };

  const handleEditCharacter = async (characterData: Omit<Character, "id">) => {
    if (!selectedCharacter) return;

    setCharacterFormLoading(true);
    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        throw new Error("Failed to update character");
      }

      const updatedCharacter = await response.json();
      setCharacters((prev) =>
        prev.map((char) =>
          char.id === updatedCharacter.id ? updatedCharacter : char,
        ),
      );
      setShowEditModal(false);
      setSelectedCharacter(updatedCharacter);
    } catch (error) {
      console.error("Failed to update character:", error);
      throw error;
    } finally {
      setCharacterFormLoading(false);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/characters/${selectedCharacter.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete character");
      }

      setCharacters((prev) =>
        prev.filter((char) => char.id !== selectedCharacter.id),
      );
      setShowDeleteModal(false);
      setSelectedCharacter(null);
    } catch (error) {
      console.error("Failed to delete character:", error);
      throw error;
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddSpell = async (spellData: Omit<Spell, "id">) => {
    setSpellFormLoading(true);
    try {
      const response = await fetch("/api/spells", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(spellData),
      });

      if (!response.ok) {
        throw new Error("Failed to create spell");
      }

      const newSpell = await response.json();
      setSpells((prev) => [...prev, newSpell]);
      setShowAddSpellModal(false);
      setSelectedSpell(newSpell);
    } catch (error) {
      console.error("Failed to create spell:", error);
      throw error;
    } finally {
      setSpellFormLoading(false);
    }
  };

  const handleEditSpell = async (spellData: Omit<Spell, "id">) => {
    if (!selectedSpell) return;

    setSpellFormLoading(true);
    try {
      const response = await fetch(`/api/spells/${selectedSpell.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(spellData),
      });

      if (!response.ok) {
        throw new Error("Failed to update spell");
      }

      const updatedSpell = await response.json();
      setSpells((prev) =>
        prev.map((spell) =>
          spell.id === updatedSpell.id ? updatedSpell : spell,
        ),
      );
      setShowEditSpellModal(false);
      setSelectedSpell(updatedSpell);
    } catch (error) {
      console.error("Failed to update spell:", error);
      throw error;
    } finally {
      setSpellFormLoading(false);
    }
  };

  const handleDeleteSpell = async () => {
    if (!selectedSpell) return;

    setDeleteSpellLoading(true);
    try {
      const response = await fetch(`/api/spells/${selectedSpell.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete spell");
      }

      setSpells((prev) =>
        prev.filter((spell) => spell.id !== selectedSpell.id),
      );
      setShowDeleteSpellModal(false);
      setSelectedSpell(null);
    } catch (error) {
      console.error("Failed to delete spell:", error);
      throw error;
    } finally {
      setDeleteSpellLoading(false);
    }
  };

  const handleImportSpells = async (spellsData: any[]) => {
    setImportLoading(true);
    try {
      const response = await fetch("/api/spells/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ spells: spellsData }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (result.details && Array.isArray(result.details)) {
          const errorMessage = `Import failed:\n${result.details.slice(0, 5).join("\n")}${
            result.details.length > 5
              ? `\n... and ${result.details.length - 5} more errors`
              : ""
          }`;
          setNotification({ message: errorMessage, type: "error" });
        } else {
          setNotification({
            message: result.error || "Import failed",
            type: "error",
          });
        }
        throw new Error(result.error || "Import failed");
      }

      // Success
      setNotification({
        message: `Successfully imported ${result.importedCount} spells`,
        type: "success",
      });
      setShowImportSpellModal(false);
      await fetchSpells(); // Refresh the spell list
    } catch (error) {
      console.error("Failed to import spells:", error);
      if (!notification) {
        // Only show generic error if we haven't already shown a specific one
        setNotification({ message: "Failed to import spells", type: "error" });
      }
      throw error;
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateFolder = async (folderPath: string) => {
    setFolderFormLoading(true);
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderPath }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      setNotification({
        message: `Successfully created folder: ${folderPath}`,
        type: "success",
      });
      setShowAddFolderModal(false);
      await fetchSpells(); // Refresh the spell list to pick up the new folder
    } catch (error) {
      console.error("Failed to create folder:", error);
      setNotification({ message: "Failed to create folder", type: "error" });
      throw error;
    } finally {
      setFolderFormLoading(false);
    }
  };

  const handleUpdateSpell = async (updatedSpell: Spell) => {
    try {
      const response = await fetch(`/api/spells/${updatedSpell.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSpell),
      });

      if (!response.ok) {
        throw new Error("Failed to update spell");
      }

      const result = await response.json();
      setSpells((prev) =>
        prev.map((spell) => (spell.id === result.id ? result : spell)),
      );

      if (selectedSpell?.id === result.id) {
        setSelectedSpell(result);
      }
    } catch (error) {
      console.error("Failed to update spell:", error);
      setNotification({
        message: "Failed to update spell",
        type: "error",
      });
    }
  };

  const handleAddSpellToCharacter = async (spellId: string) => {
    if (!selectedCharacter) return;

    try {
      const response = await fetch(
        `/api/characters/${selectedCharacter.id}/spells`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ spellId }),
        },
      );

      if (response.status === 409) {
        setNotification({
          message: `${selectedCharacter.name} already knows this spell!`,
          type: "warning",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to add spell to character");
      }

      // Refresh character data and grimoire
      fetchCharacters();
      setGrimoireRefreshTrigger((prev) => prev + 1);
      setNotification({
        message: `Spell added to ${selectedCharacter.name}'s grimoire!`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to add spell to character:", error);
      setNotification({
        message: "Failed to add spell to character",
        type: "error",
      });
    }
  };

  const handleRemoveSpellFromCharacter = async (spellId: string) => {
    if (!selectedCharacter) return;

    try {
      const response = await fetch(
        `/api/characters/${selectedCharacter.id}/spells/${spellId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove spell from character");
      }

      // Refresh character data and grimoire
      fetchCharacters();
      setGrimoireRefreshTrigger((prev) => prev + 1);
      setNotification({
        message: `Spell removed from ${selectedCharacter.name}'s grimoire`,
        type: "info",
      });
    } catch (error) {
      console.error("Failed to remove spell from character:", error);
      setNotification({
        message: "Failed to remove spell from character",
        type: "error",
      });
    }
  };

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
        onAddFolder={() => setShowAddFolderModal(true)}
        onEditSpell={() => setShowEditSpellModal(true)}
        onDeleteSpell={() => setShowDeleteSpellModal(true)}
        onImportSpells={() => setShowImportSpellModal(true)}
        onAddSpellToCharacter={(spell) => handleAddSpellToCharacter(spell.id)}
        hasSelectedCharacter={!!selectedCharacter}
        loading={spellsLoading}
        onUpdateSpell={handleUpdateSpell}
      />

      {/* Add Character Modal */}
      <ProtectedModal
        isOpen={showAddModal}
        onClose={handleCloseAddCharacterModal}
        title="Add New Character"
        isDirty={isCharacterFormDirty}
        confirmMessage="You have unsaved changes to this character that will be lost if you close this dialog."
      >
        <CharacterForm
          onSave={handleAddCharacter}
          onCancel={handleCloseAddCharacterModal}
          loading={characterFormLoading}
          mode="create"
          onDirtyChange={setIsCharacterFormDirty}
        />
      </ProtectedModal>

      {/* Edit Character Modal */}
      <ProtectedModal
        isOpen={showEditModal}
        onClose={handleCloseEditCharacterModal}
        title="Edit Character"
        isDirty={isCharacterFormDirty}
        confirmMessage="You have unsaved changes to this character that will be lost if you close this dialog."
      >
        <CharacterForm
          onSave={handleEditCharacter}
          onCancel={handleCloseEditCharacterModal}
          loading={characterFormLoading}
          initialData={editCharacterInitialData}
          mode="edit"
          onDirtyChange={setIsCharacterFormDirty}
        />
      </ProtectedModal>

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
      <ProtectedModal
        isOpen={showAddSpellModal}
        onClose={handleCloseAddSpellModal}
        title="Add New Spell"
        size="lg"
        isDirty={isSpellFormDirty}
        confirmMessage="You have unsaved changes to this spell that will be lost if you close this dialog."
      >
        <SpellForm
          onSave={handleAddSpell}
          onCancel={handleCloseAddSpellModal}
          loading={spellFormLoading}
          mode="create"
          allSpells={spells}
          onDirtyChange={setIsSpellFormDirty}
        />
      </ProtectedModal>

      {/* Edit Spell Modal */}
      <ProtectedModal
        isOpen={showEditSpellModal}
        onClose={handleCloseEditSpellModal}
        title="Edit Spell"
        size="lg"
        isDirty={isSpellFormDirty}
        confirmMessage="You have unsaved changes to this spell that will be lost if you close this dialog."
      >
        <SpellForm
          onSave={handleEditSpell}
          onCancel={handleCloseEditSpellModal}
          loading={spellFormLoading}
          initialData={editSpellInitialData}
          mode="edit"
          allSpells={spells}
          onDirtyChange={setIsSpellFormDirty}
        />
      </ProtectedModal>

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

      {/* Import Spells Modal */}
      <Modal
        isOpen={showImportSpellModal}
        onClose={() => setShowImportSpellModal(false)}
        title="Import Spells"
      >
        <SpellImportModal
          onImport={handleImportSpells}
          onCancel={() => setShowImportSpellModal(false)}
          loading={importLoading}
        />
      </Modal>

      {/* Add Folder Modal */}
      <Modal
        isOpen={showAddFolderModal}
        onClose={() => setShowAddFolderModal(false)}
        title="Add New Folder"
      >
        <AddFolderModal
          onSave={handleCreateFolder}
          onCancel={() => setShowAddFolderModal(false)}
          loading={folderFormLoading}
          allFolders={spells
            .map((s) => s.folderPath)
            .filter((path, index, arr) => arr.indexOf(path) === index)}
        />
      </Modal>

      {/* Notification Banner */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
