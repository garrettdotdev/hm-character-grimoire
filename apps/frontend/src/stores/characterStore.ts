import { create } from 'zustand';
import type { Character } from '@repo/types';
import { api } from '../services/api.js';

interface CharacterState {
  characters: Character[];
  selectedCharacter: Character | null;
  loading: boolean;
  error: string | null;
  hasAttemptedFetch: boolean;
}

interface CharacterActions {
  fetchCharacters: () => Promise<void>;
  selectCharacter: (character: Character | null) => void;
  createCharacter: (data: Omit<Character, 'id' | 'knownSpellIds'>) => Promise<Character>;
  updateCharacter: (id: string, data: Omit<Character, 'id' | 'knownSpellIds'>) => Promise<Character>;
  deleteCharacter: (id: string) => Promise<void>;
  importCharacters: (characters: any[]) => Promise<void>;
  addSpellToCharacter: (characterId: string, spellId: string) => Promise<void>;
  removeSpellFromCharacter: (characterId: string, spellId: string) => Promise<void>;
  clearError: () => void;
}

type CharacterStore = CharacterState & CharacterActions;

export const useCharacterStore = create<CharacterStore>((set) => ({
  // State
  characters: [],
  selectedCharacter: null,
  loading: false,
  error: null,
  hasAttemptedFetch: false,

  // Actions
  fetchCharacters: async () => {
    set({ loading: true, error: null });
    try {
      const characters = await api.getCharacters();
      set({ characters, loading: false, hasAttemptedFetch: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch characters',
        loading: false,
        hasAttemptedFetch: true
      });
    }
  },

  selectCharacter: (character) => {
    set({ selectedCharacter: character });
  },

  createCharacter: async (data) => {
    set({ loading: true, error: null });
    try {
      const newCharacter = await api.createCharacter(data);
      set(state => ({
        characters: [...state.characters, newCharacter],
        selectedCharacter: newCharacter,
        loading: false
      }));
      return newCharacter;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create character',
        loading: false 
      });
      throw error;
    }
  },

  updateCharacter: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedCharacter = await api.updateCharacter(id, data);
      set(state => ({
        characters: state.characters.map(char =>
          char.id === id ? updatedCharacter : char
        ),
        selectedCharacter: state.selectedCharacter?.id === id ? updatedCharacter : state.selectedCharacter,
        loading: false
      }));
      return updatedCharacter;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update character',
        loading: false
      });
      throw error;
    }
  },

  deleteCharacter: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteCharacter(id);
      set(state => ({
        characters: state.characters.filter(char => char.id !== id),
        selectedCharacter: state.selectedCharacter?.id === id ? null : state.selectedCharacter,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete character',
        loading: false 
      });
      throw error;
    }
  },

  importCharacters: async (characters) => {
    set({ loading: true, error: null });
    try {
      await api.importCharacters({ characters });
      // Refresh the character list after import
      const updatedCharacters = await api.getCharacters();
      set({ characters: updatedCharacters, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import characters',
        loading: false
      });
      throw error;
    }
  },

  addSpellToCharacter: async (characterId, spellId) => {
    try {
      await api.addSpellToCharacter(characterId, spellId);
      // Refresh the character data to get updated spell list
      const updatedCharacter = await api.getCharacter(characterId);
      set(state => ({
        characters: state.characters.map(char => 
          char.id === characterId ? updatedCharacter : char
        ),
        selectedCharacter: state.selectedCharacter?.id === characterId ? updatedCharacter : state.selectedCharacter,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add spell to character'
      });
      throw error;
    }
  },

  removeSpellFromCharacter: async (characterId, spellId) => {
    try {
      await api.removeSpellFromCharacter(characterId, spellId);
      // Refresh the character data to get updated spell list
      const updatedCharacter = await api.getCharacter(characterId);
      set(state => ({
        characters: state.characters.map(char => 
          char.id === characterId ? updatedCharacter : char
        ),
        selectedCharacter: state.selectedCharacter?.id === characterId ? updatedCharacter : state.selectedCharacter,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove spell from character'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
