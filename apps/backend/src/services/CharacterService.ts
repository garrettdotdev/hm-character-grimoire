import crypto from 'crypto';
import { Character, CreateCharacterRequest, UpdateCharacterRequest, Spell } from '@repo/types';
import type { ICharacterRepository } from '../repositories/ICharacterRepository.js';
import type { ISpellRepository } from '../repositories/ISpellRepository.js';
import { AppError } from '../middleware/errorHandler.js';

export class CharacterService {
  constructor(
    private characterRepository: ICharacterRepository,
    private spellRepository: ISpellRepository
  ) {}

  async getAllCharacters(): Promise<Character[]> {
    return await this.characterRepository.findAll();
  }

  async getCharacterById(id: string): Promise<Character> {
    const character = await this.characterRepository.findById(id);
    if (!character) {
      throw new AppError('Character not found', 404);
    }
    return character;
  }

  async createCharacter(data: CreateCharacterRequest): Promise<Character> {
    const character: Character = {
      id: crypto.randomUUID(),
      name: data.name,
      convocations: data.convocations,
      rank: data.rank,
      game: data.game || '',
      knownSpellIds: [],
    };

    await this.characterRepository.create(character);
    return character;
  }

  async updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
    const existingCharacter = await this.getCharacterById(id);
    
    const updatedCharacter: Character = {
      ...existingCharacter,
      ...data,
      id, // Ensure ID cannot be changed
    };

    await this.characterRepository.update(updatedCharacter);
    return updatedCharacter;
  }

  async deleteCharacter(id: string): Promise<void> {
    const character = await this.characterRepository.findById(id);
    if (!character) {
      throw new AppError('Character not found', 404);
    }

    await this.characterRepository.delete(id);
  }

  async getCharacterSpells(characterId: string): Promise<Spell[]> {
    const character = await this.getCharacterById(characterId);
    return await this.spellRepository.findByIds(character.knownSpellIds);
  }

  async addSpellToCharacter(characterId: string, spellId: string): Promise<void> {
    // Verify character exists
    const character = await this.getCharacterById(characterId);

    // Verify spell exists
    const spell = await this.spellRepository.findById(spellId);
    if (!spell) {
      throw new AppError('Spell not found', 404);
    }

    // Check if character already knows this spell
    const hasSpell = await this.characterRepository.hasSpell(characterId, spellId);
    if (hasSpell) {
      throw new AppError('Character already knows this spell', 409);
    }

    // Validate character can learn this spell (business rule)
    const canLearn = await this.validateCharacterCanLearnSpell(characterId, spellId);
    if (!canLearn) {
      throw new AppError(
        `Character cannot learn spells from the ${spell.convocation} convocation. Character convocations: ${character.convocations.join(', ')}`,
        400
      );
    }

    await this.characterRepository.addSpell(characterId, spellId);
  }

  async removeSpellFromCharacter(characterId: string, spellId: string): Promise<void> {
    // Verify character exists
    await this.getCharacterById(characterId);
    
    // Check if character knows this spell
    const hasSpell = await this.characterRepository.hasSpell(characterId, spellId);
    if (!hasSpell) {
      throw new AppError('Character does not know this spell', 404);
    }

    await this.characterRepository.removeSpell(characterId, spellId);
  }

  async validateCharacterCanLearnSpell(characterId: string, spellId: string): Promise<boolean> {
    const character = await this.getCharacterById(characterId);
    const spell = await this.spellRepository.findById(spellId);
    
    if (!spell) {
      return false;
    }

    // Check if character's convocations include the spell's convocation or if it's neutral
    return character.convocations.includes(spell.convocation) || spell.convocation === 'Neutral';
  }
}
