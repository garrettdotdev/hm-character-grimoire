import { create } from 'zustand';
import type { Spell, CreateSpellRequest, UpdateSpellRequest } from '@repo/types';
import { api } from '../services/api.js';
import { useNotificationStore } from './notificationStore.js';

interface SpellState {
  spells: Spell[];
  selectedSpell: Spell | null;
  loading: boolean;
  error: string | null;
  hasAttemptedFetch: boolean;
}

interface SpellActions {
  fetchSpells: () => Promise<void>;
  selectSpell: (spell: Spell | null) => void;
  createSpell: (data: CreateSpellRequest) => Promise<Spell>;
  updateSpell: (id: string, data: UpdateSpellRequest) => Promise<Spell>;
  deleteSpell: (id: string) => Promise<void>;
  moveSpell: (spellId: string, folderId: number) => Promise<Spell>;
  importSpells: (spells: CreateSpellRequest[]) => Promise<void>;
  getCharacterSpells: (characterId: string) => Promise<Spell[]>;
  clearError: () => void;
}

type SpellStore = SpellState & SpellActions;

export const useSpellStore = create<SpellStore>((set, get) => ({
  // State
  spells: [],
  selectedSpell: null,
  loading: false,
  error: null,
  hasAttemptedFetch: false,

  // Actions
  fetchSpells: async () => {
    set({ loading: true, error: null });
    try {
      const spells = await api.getSpells();
      set({ spells, loading: false, hasAttemptedFetch: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch spells',
        loading: false,
        hasAttemptedFetch: true
      });
    }
  },

  selectSpell: (spell) => {
    set({ selectedSpell: spell });
  },

  createSpell: async (data) => {
    set({ loading: true, error: null });
    try {
      const newSpell = await api.createSpell(data);
      set(state => ({
        spells: [...state.spells, newSpell],
        loading: false
      }));

      // Show success notification
      useNotificationStore.getState().showSuccess('Spell created successfully');

      return newSpell;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create spell',
        loading: false
      });
      throw error;
    }
  },

  updateSpell: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedSpell = await api.updateSpell(id, data);
      set(state => ({
        spells: state.spells.map(spell => 
          spell.id === id ? updatedSpell : spell
        ),
        selectedSpell: state.selectedSpell?.id === id ? updatedSpell : state.selectedSpell,
        loading: false
      }));
      return updatedSpell;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update spell',
        loading: false 
      });
      throw error;
    }
  },

  deleteSpell: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteSpell(id);
      set(state => ({
        spells: state.spells.filter(spell => spell.id !== id),
        selectedSpell: state.selectedSpell?.id === id ? null : state.selectedSpell,
        loading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete spell',
        loading: false
      });
      throw error;
    }
  },

  moveSpell: async (spellId, folderId) => {
    set({ loading: true, error: null });
    try {
      const movedSpell = await api.moveSpell(spellId, folderId);
      set(state => ({
        spells: state.spells.map(spell =>
          spell.id === spellId ? movedSpell : spell
        ),
        selectedSpell: state.selectedSpell?.id === spellId ? movedSpell : state.selectedSpell,
        loading: false
      }));
      return movedSpell;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move spell',
        loading: false
      });
      throw error;
    }
  },

  importSpells: async (spells) => {
    set({ loading: true, error: null });
    try {
      await api.importSpells({ spells });
      // Refresh the spell list after import
      await get().fetchSpells();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import spells',
        loading: false 
      });
      throw error;
    }
  },

  getCharacterSpells: async (characterId) => {
    try {
      return await api.getCharacterSpells(characterId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch character spells'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
