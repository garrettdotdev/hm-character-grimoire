import { BaseRepository } from './BaseRepository.js';
import { Spell, SpellConvocation, BonusEffect } from '@repo/types';
import type { ISpellRepository } from './ISpellRepository.js';

interface SpellRow {
  id: string;
  name: string;
  convocation: string;
  complexity_level: number;
  description: string;
  bonus_effects: string;
  casting_time: string;
  range: string;
  duration: string;
  folder_id: number;
  source_book: string;
  source_page: string;
}

export class SpellRepository extends BaseRepository implements ISpellRepository {
  async findAll(): Promise<Spell[]> {
    const rows = await this.runQueryAll<SpellRow>('SELECT * FROM spells ORDER BY name');
    return rows.map(this.mapRowToSpell);
  }

  async findById(id: string): Promise<Spell | null> {
    const row = await this.runQuery<SpellRow>('SELECT * FROM spells WHERE id = ?', [id]);
    return row ? this.mapRowToSpell(row) : null;
  }

  async findByIds(ids: string[]): Promise<Spell[]> {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const rows = await this.runQueryAll<SpellRow>(
      `SELECT * FROM spells WHERE id IN (${placeholders}) ORDER BY name`,
      ids
    );
    return rows.map(this.mapRowToSpell);
  }

  async findByConvocation(convocation: SpellConvocation): Promise<Spell[]> {
    const rows = await this.runQueryAll<SpellRow>(
      'SELECT * FROM spells WHERE convocation = ? ORDER BY name',
      [convocation]
    );
    return rows.map(this.mapRowToSpell);
  }

  async findByFolderId(folderId: number): Promise<Spell[]> {
    const rows = await this.runQueryAll<SpellRow>(
      'SELECT * FROM spells WHERE folder_id = ? ORDER BY name',
      [folderId]
    );
    return rows.map(this.mapRowToSpell);
  }

  async create(spell: Spell): Promise<void> {
    await this.runStatement(
      `INSERT INTO spells (
        id, name, convocation, complexity_level, description, bonus_effects,
        casting_time, range, duration, folder_id, source_book, source_page
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        spell.id,
        spell.name,
        spell.convocation,
        spell.complexityLevel,
        spell.description,
        JSON.stringify(spell.bonusEffects),
        spell.castingTime,
        spell.range,
        spell.duration,
        spell.folderId || 1, // Default to root folder
        spell.sourceBook || '',
        spell.sourcePage || 0,
      ]
    );
  }

  async update(spell: Spell): Promise<void> {
    await this.runStatement(
      `UPDATE spells SET
        name = ?, convocation = ?, complexity_level = ?, description = ?,
        bonus_effects = ?, casting_time = ?, range = ?, duration = ?,
        folder_id = ?, source_book = ?, source_page = ?
      WHERE id = ?`,
      [
        spell.name,
        spell.convocation,
        spell.complexityLevel,
        spell.description,
        JSON.stringify(spell.bonusEffects),
        spell.castingTime,
        spell.range,
        spell.duration,
        spell.folderId || 1, // Default to root folder
        spell.sourceBook || '',
        spell.sourcePage || 0,
        spell.id,
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.runStatement('DELETE FROM spells WHERE id = ?', [id]);
  }

  async updateFolderId(spellId: string, folderId: number): Promise<void> {
    await this.runStatement(
      'UPDATE spells SET folder_id = ? WHERE id = ?',
      [folderId, spellId]
    );
  }

  async moveSpellsToFolder(fromFolderId: number, toFolderId: number): Promise<void> {
    await this.runStatement(
      'UPDATE spells SET folder_id = ? WHERE folder_id = ?',
      [toFolderId, fromFolderId]
    );
  }

  async search(query: string): Promise<Spell[]> {
    const rows = await this.runQueryAll<SpellRow>(
      `SELECT * FROM spells
       WHERE name LIKE ? OR description LIKE ? OR convocation LIKE ?
       ORDER BY name`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows.map(this.mapRowToSpell);
  }

  async getSpellCount(): Promise<number> {
    const row = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM spells'
    );
    return row?.count || 0;
  }

  async createMany(spells: Spell[]): Promise<void> {
    for (const spell of spells) {
      await this.create(spell);
    }
  }

  private mapRowToSpell(row: SpellRow): Spell {
    return {
      id: row.id,
      name: row.name,
      convocation: row.convocation as SpellConvocation,
      complexityLevel: row.complexity_level,
      description: row.description,
      bonusEffects: JSON.parse(row.bonus_effects) as BonusEffect[],
      castingTime: row.casting_time,
      range: row.range,
      duration: row.duration,
      folderId: row.folder_id || 1, // Default to root folder
      sourceBook: row.source_book || '',
      sourcePage: row.source_page || '',
    };
  }
}
