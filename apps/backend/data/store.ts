import { Spell } from "../models/Spell.js";
import { Character } from "../models/Character.js";
import { database } from "./database.js";

export class DataStore {
  // Spell methods
  async getAllSpells(): Promise<Spell[]> {
    return await database.getAllSpells();
  }

  async getSpellById(id: string): Promise<Spell | undefined> {
    return await database.getSpellById(id);
  }

  async addSpell(spell: Spell): Promise<void> {
    return await database.addSpell(spell);
  }

  async updateSpell(spell: Spell): Promise<void> {
    return await database.updateSpell(spell);
  }

  async deleteSpell(id: string): Promise<void> {
    return await database.deleteSpell(id);
  }

  async addSpellToCharacter(
    characterId: string,
    spellId: string,
  ): Promise<void> {
    return await database.addSpellToCharacter(characterId, spellId);
  }

  async removeSpellFromCharacter(
    characterId: string,
    spellId: string,
  ): Promise<void> {
    return await database.removeSpellFromCharacter(characterId, spellId);
  }

  // Folder methods
  async getAllFolders(): Promise<string[]> {
    return await database.getAllFolders();
  }

  async createFolder(folderPath: string): Promise<void> {
    return await database.createFolder(folderPath);
  }

  async renameFolder(oldPath: string, newPath: string): Promise<void> {
    return await database.renameFolder(oldPath, newPath);
  }

  async deleteFolder(folderPath: string): Promise<void> {
    return await database.deleteFolder(folderPath);
  }

  // Character methods
  async getAllCharacters(): Promise<Character[]> {
    return await database.getAllCharacters();
  }

  async getCharacterById(id: string): Promise<Character | undefined> {
    return await database.getCharacterById(id);
  }

  async addCharacter(character: Character): Promise<void> {
    return await database.addCharacter(character);
  }

  async updateCharacter(character: Character): Promise<void> {
    return await database.updateCharacter(character);
  }

  async deleteCharacter(id: string): Promise<void> {
    return await database.deleteCharacter(id);
  }

  // Relationship methods
  async getSpellsForCharacter(characterId: string): Promise<Spell[]> {
    return await database.getSpellsForCharacter(characterId);
  }
}

export const dataStore = new DataStore();
