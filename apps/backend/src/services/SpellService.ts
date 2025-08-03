import crypto from 'crypto';
import { Spell, CreateSpellRequest, UpdateSpellRequest } from '@repo/types';
import type { ISpellRepository } from '../repositories/ISpellRepository.js';
import type { IFolderRepository } from '../repositories/IFolderRepository.js';
import { AppError, ConflictError, NotFoundError } from '../middleware/errorHandler.js';
import { TransactionService } from './TransactionService.js';

export class SpellService {
  private transactionService: TransactionService;

  constructor(
    private spellRepository: ISpellRepository,
    private folderRepository: IFolderRepository
  ) {
    this.transactionService = new TransactionService();
  }

  async getAllSpells(): Promise<Spell[]> {
    return await this.spellRepository.findAll();
  }

  async getSpellById(id: string): Promise<Spell> {
    const spell = await this.spellRepository.findById(id);
    if (!spell) {
      throw new AppError('Spell not found', 404);
    }
    return spell;
  }

  async createSpell(data: CreateSpellRequest): Promise<Spell> {
    // Validate folder exists
    const folderId = data.folderId || 1;
    const folderExists = await this.folderRepository.exists(folderId);
    if (!folderExists) {
      throw new NotFoundError('Folder not found', { folderId });
    }

    // Check if spell with same name already exists
    const existingSpell = await this.spellRepository.findByExactName(data.name);
    if (existingSpell) {
      throw new ConflictError(`A spell with the name "${data.name}" already exists`, {
        field: 'name',
        value: data.name,
        existingSpellId: existingSpell.id,
      });
    }

    const spell: Spell = {
      id: crypto.randomUUID(),
      name: data.name,
      convocation: data.convocation,
      complexityLevel: data.complexityLevel,
      description: data.description,
      bonusEffects: data.bonusEffects || [],
      castingTime: data.castingTime || '',
      range: data.range || '',
      duration: data.duration || '',
      folderId,
      sourceBook: data.sourceBook || '',
      sourcePage: data.sourcePage || '',
    };

    try {
      await this.spellRepository.create(spell);
      return spell;
    } catch (error) {
      // Handle database-level constraint violations as a fallback
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new ConflictError(`A spell with the name "${data.name}" already exists`, {
          field: 'name',
          value: data.name,
        });
      }
      throw error;
    }
  }

  async updateSpell(id: string, data: UpdateSpellRequest): Promise<Spell> {
    const existingSpell = await this.getSpellById(id);

    // Validate folder exists if provided
    if (data.folderId !== undefined) {
      const folderExists = await this.folderRepository.exists(data.folderId);
      if (!folderExists) {
        throw new NotFoundError('Folder not found', { folderId: data.folderId });
      }
    }

    // Check if spell name is being changed and if it conflicts with existing spell
    if (data.name && data.name !== existingSpell.name) {
      const conflictingSpell = await this.spellRepository.findByExactName(data.name);
      if (conflictingSpell) {
        throw new ConflictError(`A spell with the name "${data.name}" already exists`, {
          field: 'name',
          value: data.name,
          existingSpellId: conflictingSpell.id,
        });
      }
    }

    const updatedSpell: Spell = {
      ...existingSpell,
      ...data,
      id, // Ensure ID cannot be changed
    };

    try {
      await this.spellRepository.update(updatedSpell);
      return updatedSpell;
    } catch (error) {
      // Handle database-level constraint violations as a fallback
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new ConflictError(`A spell with the name "${updatedSpell.name}" already exists`, {
          field: 'name',
          value: updatedSpell.name,
        });
      }
      throw error;
    }
  }

  async deleteSpell(id: string): Promise<void> {
    const spell = await this.spellRepository.findById(id);
    if (!spell) {
      throw new NotFoundError('Spell not found', { spellId: id });
    }

    await this.spellRepository.delete(id);
  }

  async importSpells(spells: CreateSpellRequest[]): Promise<{
    importedCount: number;
    spells: Spell[];
    errors?: Array<{ spell: CreateSpellRequest; error: string }>
  }> {
    if (spells.length === 0) {
      return { importedCount: 0, spells: [] };
    }

    // Validate all folders exist before starting import
    const folderIds = [...new Set(spells.map(s => s.folderId || 1))];
    for (const folderId of folderIds) {
      const exists = await this.folderRepository.exists(folderId);
      if (!exists) {
        throw new NotFoundError(`Folder with ID ${folderId} not found`, { folderId });
      }
    }

    // Check for duplicate names within the import batch
    const nameMap = new Map<string, number>();
    const duplicatesInBatch: Array<{ spell: CreateSpellRequest; error: string }> = [];

    spells.forEach((spell, index) => {
      const existingIndex = nameMap.get(spell.name);
      if (existingIndex !== undefined) {
        duplicatesInBatch.push({
          spell,
          error: `Duplicate spell name "${spell.name}" found in import batch (first occurrence at position ${existingIndex + 1})`,
        });
      } else {
        nameMap.set(spell.name, index);
      }
    });

    // Check for existing spells in database
    const existingSpellNames = new Set<string>();
    for (const spellData of spells) {
      const existing = await this.spellRepository.findByExactName(spellData.name);
      if (existing) {
        existingSpellNames.add(spellData.name);
      }
    }

    const errors: Array<{ spell: CreateSpellRequest; error: string }> = [
      ...duplicatesInBatch,
      ...spells
        .filter(spell => existingSpellNames.has(spell.name))
        .map(spell => ({
          spell,
          error: `A spell with the name "${spell.name}" already exists in the database`,
        })),
    ];

    // Filter out spells with errors
    const validSpells = spells.filter(spell =>
      !duplicatesInBatch.some(dup => dup.spell === spell) &&
      !existingSpellNames.has(spell.name)
    );

    if (validSpells.length === 0) {
      return {
        importedCount: 0,
        spells: [],
        errors,
      };
    }

    // Import valid spells in a single transaction
    const importedSpells = await this.transactionService.executeTransaction(async (tx) => {
      const results: Spell[] = [];

      for (const spellData of validSpells) {
        const spell: Spell = {
          id: crypto.randomUUID(),
          name: spellData.name,
          convocation: spellData.convocation,
          complexityLevel: spellData.complexityLevel,
          description: spellData.description,
          bonusEffects: spellData.bonusEffects || [],
          castingTime: spellData.castingTime || '',
          range: spellData.range || '',
          duration: spellData.duration || '',
          folderId: spellData.folderId || 1,
          sourceBook: spellData.sourceBook || '',
          sourcePage: spellData.sourcePage || '',
        };

        // Create spell directly with transaction client
        await tx.spell.create({
          data: {
            id: spell.id,
            name: spell.name,
            convocation: spell.convocation,
            complexityLevel: spell.complexityLevel,
            description: spell.description,
            bonusEffects: JSON.stringify(spell.bonusEffects),
            castingTime: spell.castingTime,
            range: spell.range,
            duration: spell.duration,
            folderId: spell.folderId,
            sourceBook: spell.sourceBook,
            sourcePage: spell.sourcePage,
          }
        });

        results.push(spell);
      }

      return results;
    });

    const result: any = {
      importedCount: importedSpells.length,
      spells: importedSpells,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }

  async getSpellsByIds(ids: string[]): Promise<Spell[]> {
    return await this.spellRepository.findByIds(ids);
  }

  async moveSpell(spellId: string, newFolderId: number): Promise<Spell> {
    // Validate spell exists
    const spell = await this.getSpellById(spellId);

    // Validate target folder exists
    const folderExists = await this.folderRepository.exists(newFolderId);
    if (!folderExists) {
      throw new AppError('Target folder not found', 404);
    }

    const updatedSpell: Spell = {
      ...spell,
      folderId: newFolderId,
    };

    await this.spellRepository.update(updatedSpell);
    return updatedSpell;
  }

  async getSpellsByFolder(folderId: number): Promise<Spell[]> {
    return await this.spellRepository.findByFolderId(folderId);
  }

  async moveSpellsToFolder(fromFolderId: number, toFolderId: number): Promise<void> {
    // Validate both folders exist
    const fromExists = await this.folderRepository.exists(fromFolderId);
    if (!fromExists) {
      throw new AppError('Source folder not found', 404);
    }

    const toExists = await this.folderRepository.exists(toFolderId);
    if (!toExists) {
      throw new AppError('Target folder not found', 404);
    }

    await this.spellRepository.moveSpellsToFolder(fromFolderId, toFolderId);
  }

  async searchSpells(query: string): Promise<Spell[]> {
    if (!query.trim()) {
      return [];
    }
    return await this.spellRepository.search(query.trim());
  }
}
