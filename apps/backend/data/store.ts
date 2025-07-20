import { Spell } from '../models/Spell.js';
import { Character } from '../models/Character.js';
import { database } from './database.js';

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

    // Relationship methods
    async getSpellsForCharacter(characterId: string): Promise<Spell[]> {
        return await database.getSpellsForCharacter(characterId);
    }
}

export const dataStore = new DataStore();