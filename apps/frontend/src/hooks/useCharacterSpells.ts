import { useState, useEffect } from 'react';
import type { Spell } from '@repo/types';
import { useSpellStore } from '../stores/spellStore.js';

export function useCharacterSpells(characterId: string | null) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getCharacterSpells } = useSpellStore();

  useEffect(() => {
    if (!characterId) {
      setSpells([]);
      setError(null);
      return;
    }

    const fetchSpells = async () => {
      setLoading(true);
      setError(null);
      try {
        const characterSpells = await getCharacterSpells(characterId);
        setSpells(characterSpells);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch character spells');
        setSpells([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpells();
  }, [characterId]); // Remove getCharacterSpells from dependencies

  const refetch = async () => {
    if (!characterId) return;
    
    setLoading(true);
    setError(null);
    try {
      const characterSpells = await getCharacterSpells(characterId);
      setSpells(characterSpells);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch character spells');
    } finally {
      setLoading(false);
    }
  };

  return {
    spells,
    loading,
    error,
    refetch,
  };
}
