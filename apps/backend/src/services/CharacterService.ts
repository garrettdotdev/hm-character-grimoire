import crypto from 'crypto';
import {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  Spell,
  CharacterImportPreview,
  CharacterImportResponse,
  CharacterSpellInfo,
  CharacterImportError
} from '@repo/types';
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

  async importCharacters(charactersData: CreateCharacterRequest[]): Promise<CharacterImportResponse> {
    const previews: CharacterImportPreview[] = [];
    const errors: CharacterImportError[] = [];
    let charactersImported = 0;
    let spellsAssigned = 0;

    // Get all existing character names for duplicate checking
    const existingCharacters = await this.characterRepository.findAll();
    const existingNames = new Set(existingCharacters.map(c => c.name.toLowerCase()));

    // Track names within this import batch
    const importBatchNames = new Set<string>();

    // Generate previews first
    for (const characterData of charactersData) {
      try {
        const preview = await this.generateCharacterImportPreview(
          characterData,
          existingNames,
          importBatchNames
        );
        previews.push(preview);
        importBatchNames.add(preview.character.finalName.toLowerCase());
      } catch (error) {
        errors.push({
          item: characterData,
          character: characterData,
          error: error instanceof Error ? error.message : 'Unknown error during preview generation'
        });
      }
    }

    // Import characters that have valid previews
    for (const preview of previews) {
      try {
        const character = await this.createCharacterFromPreview(preview);
        charactersImported++;
        spellsAssigned += preview.spells.found.length;
      } catch (error) {
        errors.push({
          item: preview.character,
          character: preview.character,
          error: error instanceof Error ? error.message : 'Unknown error during character creation'
        });
      }
    }

    const totalAttempted = charactersData.length;
    const errorCount = errors.length;

    let message: string;
    if (charactersImported === 0) {
      message = `Failed to import any characters. ${errorCount} errors occurred.`;
    } else if (errorCount > 0) {
      message = `Partially successful: imported ${charactersImported} characters, ${errorCount} failed. ${spellsAssigned} spells assigned.`;
    } else {
      message = `Successfully imported ${charactersImported} characters with ${spellsAssigned} spells.`;
    }

    return {
      message,
      importedCount: charactersImported,
      totalAttempted,
      errorCount: errorCount > 0 ? errorCount : undefined,
      errors: errorCount > 0 ? errors : undefined,
      previews,
      charactersImported,
      spellsAssigned
    };
  }

  private async generateCharacterImportPreview(
    characterData: CreateCharacterRequest,
    existingNames: Set<string>,
    importBatchNames: Set<string>
  ): Promise<CharacterImportPreview> {
    // Generate unique name
    const finalName = this.generateUniqueName(characterData.name, existingNames, importBatchNames);

    // Resolve spell names to spell data
    const spellResolution = await this.resolveSpellNames(
      characterData.knownSpells || [],
      characterData.convocations
    );

    const warnings: string[] = [];
    if (finalName !== characterData.name) {
      warnings.push(`Character name changed from "${characterData.name}" to "${finalName}" to avoid duplicates`);
    }

    return {
      character: {
        name: characterData.name,
        finalName,
        convocations: characterData.convocations,
        rank: characterData.rank,
        game: characterData.game || ''
      },
      spells: spellResolution,
      warnings
    };
  }

  private generateUniqueName(
    baseName: string,
    existingNames: Set<string>,
    importBatchNames: Set<string>
  ): string {
    let finalName = baseName;
    let counter = 1;

    while (existingNames.has(finalName.toLowerCase()) || importBatchNames.has(finalName.toLowerCase())) {
      counter++;
      finalName = `${baseName} (${counter})`;
    }

    return finalName;
  }

  private async resolveSpellNames(
    spellNames: string[],
    characterConvocations: string[]
  ): Promise<{
    found: CharacterSpellInfo[];
    notFound: string[];
    incompatible: Array<{ name: string; convocation: any; reason: string }>;
  }> {
    const found: CharacterSpellInfo[] = [];
    const notFound: string[] = [];
    const incompatible: Array<{ name: string; convocation: any; reason: string }> = [];

    // Get all spells to search through
    const allSpells = await this.spellRepository.findAll();
    const spellMap = new Map<string, Spell>();

    // Create case-insensitive lookup
    for (const spell of allSpells) {
      spellMap.set(spell.name.toLowerCase(), spell);
    }

    for (const spellName of spellNames) {
      const spell = spellMap.get(spellName.toLowerCase());

      if (!spell) {
        notFound.push(spellName);
        continue;
      }

      // Check if character can learn this spell
      const canLearn = characterConvocations.includes(spell.convocation) || spell.convocation === 'Neutral';

      if (!canLearn) {
        incompatible.push({
          name: spellName,
          convocation: spell.convocation,
          reason: `Spell is from ${spell.convocation} convocation, but character only knows: ${characterConvocations.join(', ')}`
        });
        continue;
      }

      found.push({
        name: spell.name,
        id: spell.id,
        convocation: spell.convocation as any
      });
    }

    return { found, notFound, incompatible };
  }

  private async createCharacterFromPreview(preview: CharacterImportPreview): Promise<Character> {
    // Create the character
    const character: Character = {
      id: crypto.randomUUID(),
      name: preview.character.finalName,
      convocations: preview.character.convocations as any,
      rank: preview.character.rank as any,
      game: preview.character.game,
      knownSpellIds: preview.spells.found.map(s => s.id)
    };

    await this.characterRepository.create(character);

    // Add spells to character
    for (const spell of preview.spells.found) {
      await this.characterRepository.addSpell(character.id, spell.id);
    }

    return character;
  }
}
