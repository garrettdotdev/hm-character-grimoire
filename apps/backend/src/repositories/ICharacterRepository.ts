import type { Character } from '@repo/types';

export interface ICharacterRepository {
  findAll(): Promise<Character[]>;
  findById(id: string): Promise<Character | null>;
  create(character: Character): Promise<void>;
  update(character: Character): Promise<void>;
  delete(id: string): Promise<void>;
  addSpell(characterId: string, spellId: string): Promise<void>;
  removeSpell(characterId: string, spellId: string): Promise<void>;
  hasSpell(characterId: string, spellId: string): Promise<boolean>;
  search(query: string): Promise<Character[]>;
  getCharacterCount(): Promise<number>;
}
