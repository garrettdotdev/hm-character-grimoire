import { BaseRepository } from './BaseRepository.js';
import { Character, CharacterRank, SpellConvocation } from '@repo/types';
import type { ICharacterRepository } from './ICharacterRepository.js';

interface CharacterRow {
  id: string;
  name: string;
  convocations: string;
  rank: string;
  game: string;
}

export class CharacterRepository extends BaseRepository implements ICharacterRepository {
  async findAll(): Promise<Character[]> {
    const rows = await this.runQueryAll<CharacterRow>('SELECT * FROM characters ORDER BY name');
    const characters = await Promise.all(
      rows.map(async (row) => {
        const knownSpellIds = await this.getKnownSpellIds(row.id);
        return this.mapRowToCharacter(row, knownSpellIds);
      })
    );
    return characters;
  }

  async findById(id: string): Promise<Character | null> {
    const row = await this.runQuery<CharacterRow>('SELECT * FROM characters WHERE id = ?', [id]);
    if (!row) return null;
    
    const knownSpellIds = await this.getKnownSpellIds(id);
    return this.mapRowToCharacter(row, knownSpellIds);
  }

  async create(character: Character): Promise<void> {
    await this.runTransaction([
      async () => {
        await this.runStatement(
          'INSERT INTO characters (id, name, convocations, rank, game) VALUES (?, ?, ?, ?, ?)',
          [
            character.id,
            character.name,
            JSON.stringify(character.convocations),
            character.rank,
            character.game,
          ]
        );
      },
      async () => {
        if (character.knownSpellIds.length > 0) {
          for (const spellId of character.knownSpellIds) {
            await this.runStatement(
              'INSERT INTO character_spells (character_id, spell_id) VALUES (?, ?)',
              [character.id, spellId]
            );
          }
        }
      },
    ]);
  }

  async update(character: Character): Promise<void> {
    await this.runTransaction([
      async () => {
        await this.runStatement(
          'UPDATE characters SET name = ?, convocations = ?, rank = ?, game = ? WHERE id = ?',
          [
            character.name,
            JSON.stringify(character.convocations),
            character.rank,
            character.game,
            character.id,
          ]
        );
      },
      async () => {
        // Remove all existing spell relationships
        await this.runStatement(
          'DELETE FROM character_spells WHERE character_id = ?',
          [character.id]
        );
      },
      async () => {
        // Add new spell relationships
        if (character.knownSpellIds.length > 0) {
          for (const spellId of character.knownSpellIds) {
            await this.runStatement(
              'INSERT INTO character_spells (character_id, spell_id) VALUES (?, ?)',
              [character.id, spellId]
            );
          }
        }
      },
    ]);
  }

  async delete(id: string): Promise<void> {
    // The foreign key constraint will automatically delete character_spells entries
    await this.runStatement('DELETE FROM characters WHERE id = ?', [id]);
  }

  async addSpell(characterId: string, spellId: string): Promise<void> {
    await this.runStatement(
      'INSERT OR IGNORE INTO character_spells (character_id, spell_id) VALUES (?, ?)',
      [characterId, spellId]
    );
  }

  async removeSpell(characterId: string, spellId: string): Promise<void> {
    await this.runStatement(
      'DELETE FROM character_spells WHERE character_id = ? AND spell_id = ?',
      [characterId, spellId]
    );
  }

  async getKnownSpellIds(characterId: string): Promise<string[]> {
    const rows = await this.runQueryAll<{ spell_id: string }>(
      'SELECT spell_id FROM character_spells WHERE character_id = ?',
      [characterId]
    );
    return rows.map(row => row.spell_id);
  }

  async hasSpell(characterId: string, spellId: string): Promise<boolean> {
    const row = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM character_spells WHERE character_id = ? AND spell_id = ?',
      [characterId, spellId]
    );
    return row ? row.count > 0 : false;
  }

  async search(query: string): Promise<Character[]> {
    const rows = await this.runQueryAll<CharacterRow>(
      `SELECT * FROM characters
       WHERE name LIKE ? OR game LIKE ? OR rank LIKE ?
       ORDER BY name`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    const characters = await Promise.all(
      rows.map(async (row) => {
        const knownSpellIds = await this.getKnownSpellIds(row.id);
        return this.mapRowToCharacter(row, knownSpellIds);
      })
    );
    return characters;
  }

  async getCharacterCount(): Promise<number> {
    const row = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM characters'
    );
    return row?.count || 0;
  }

  private mapRowToCharacter(row: CharacterRow, knownSpellIds: string[]): Character {
    return {
      id: row.id,
      name: row.name,
      convocations: JSON.parse(row.convocations) as SpellConvocation[],
      rank: row.rank as CharacterRank,
      game: row.game,
      knownSpellIds,
    };
  }
}
