import { create } from 'zustand';
import { api } from '../services/api.js';
import type { FolderWithPath } from '@repo/types';

interface FolderState {
  folders: FolderWithPath[];
  loading: boolean;
  error: string | null;
  hasAttemptedFetch: boolean;
}

interface FolderActions {
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: number | null) => Promise<number>;
  deleteFolder: (folderId: number, strategy?: 'empty-only' | 'move-to-parent' | 'recursive') => Promise<void>;
  renameFolder: (folderId: number, newName: string) => Promise<void>;
  moveFolder: (folderId: number, newParentId: number | null) => Promise<void>;
  clearError: () => void;
}

type FolderStore = FolderState & FolderActions;

export const useFolderStore = create<FolderStore>((set, get) => ({
  // State
  folders: [],
  loading: false,
  error: null,
  hasAttemptedFetch: false,

  // Actions
  fetchFolders: async () => {
    set({ loading: true, error: null });
    try {
      const folders = await api.getFolders();
      set({ folders, loading: false, hasAttemptedFetch: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch folders',
        loading: false,
        hasAttemptedFetch: true
      });
    }
  },

  createFolder: async (name, parentId = 1) => {
    set({ loading: true, error: null });
    try {
      const result = await api.createFolder({ name, parentId });
      // Refresh the folder list
      await get().fetchFolders();
      return result.folderId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create folder',
        loading: false
      });
      throw error;
    }
  },

  deleteFolder: async (folderId, strategy = 'empty-only') => {
    set({ loading: true, error: null });
    try {
      await api.deleteFolder(folderId, strategy);
      // Refresh the folder list to get the updated structure
      await get().fetchFolders();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete folder',
        loading: false
      });
      throw error;
    }
  },

  renameFolder: async (folderId, newName) => {
    set({ loading: true, error: null });
    try {
      await api.renameFolder(folderId, newName);
      // Refresh the folder list to get the updated structure
      await get().fetchFolders();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to rename folder',
        loading: false
      });
      throw error;
    }
  },

  moveFolder: async (folderId, newParentId) => {
    set({ loading: true, error: null });
    try {
      await api.moveFolder(folderId, newParentId);
      // Refresh the folder list to get the updated structure
      await get().fetchFolders();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move folder',
        loading: false
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
