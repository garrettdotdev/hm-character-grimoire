import type { Spell } from '@repo/types';

export interface ISpellRepository {
  findAll(): Promise<Spell[]>;
  findById(id: string): Promise<Spell | null>;
  findByIds(ids: string[]): Promise<Spell[]>;
  findByFolderId(folderId: number): Promise<Spell[]>;
  create(spell: Spell): Promise<void>;
  update(spell: Spell): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Spell[]>;
  getSpellCount(): Promise<number>;
  moveSpellsToFolder(fromFolderId: number, toFolderId: number): Promise<void>;
  createMany(spells: Spell[]): Promise<void>;
}
