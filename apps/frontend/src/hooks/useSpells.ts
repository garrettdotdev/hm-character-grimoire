import { useEffect } from 'react';
import { useSpellStore } from '../stores/spellStore.js';

export function useSpells() {
  const {
    spells,
    selectedSpell,
    loading,
    error,
    hasAttemptedFetch,
    fetchSpells,
    selectSpell,
    createSpell,
    updateSpell,
    deleteSpell,
    importSpells,
    getCharacterSpells,
    clearError,
  } = useSpellStore();

  // Auto-fetch spells on mount (only if we haven't tried yet)
  useEffect(() => {
    if (!hasAttemptedFetch && !loading) {
      fetchSpells();
    }
  }, [hasAttemptedFetch, loading]); // Only fetch if we haven't attempted yet

  return {
    spells,
    selectedSpell,
    loading,
    error,
    actions: {
      fetchSpells,
      selectSpell,
      createSpell,
      updateSpell,
      deleteSpell,
      importSpells,
      getCharacterSpells,
      clearError,
    },
  };
}
