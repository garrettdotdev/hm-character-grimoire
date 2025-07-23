import { useEffect } from 'react';
import { useCharacterStore } from '../stores/characterStore.js';

export function useCharacters() {
  const {
    characters,
    selectedCharacter,
    loading,
    error,
    hasAttemptedFetch,
    fetchCharacters,
    selectCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    addSpellToCharacter,
    removeSpellFromCharacter,
    clearError,
  } = useCharacterStore();

  // Auto-fetch characters on mount (only if we haven't tried yet)
  useEffect(() => {
    if (!hasAttemptedFetch && !loading) {
      fetchCharacters();
    }
  }, [hasAttemptedFetch, loading]); // Only fetch if we haven't attempted yet

  return {
    characters,
    selectedCharacter,
    loading,
    error,
    actions: {
      fetchCharacters,
      selectCharacter,
      createCharacter,
      updateCharacter,
      deleteCharacter,
      addSpellToCharacter,
      removeSpellFromCharacter,
      clearError,
    },
  };
}
