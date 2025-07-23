import crypto from 'crypto';
import { Spell, CreateSpellRequest, UpdateSpellRequest } from '@repo/types';
import type { ISpellRepository } from '../repositories/ISpellRepository.js';
import type { IFolderRepository } from '../repositories/IFolderRepository.js';
import { AppError } from '../middleware/errorHandler.js';
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
      throw new AppError('Folder not found', 404);
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
      sourcePage: data.sourcePage || 0,
    };

    await this.spellRepository.create(spell);
    return spell;
  }

  async updateSpell(id: string, data: UpdateSpellRequest): Promise<Spell> {
    const existingSpell = await this.getSpellById(id);
    
    const updatedSpell: Spell = {
      ...existingSpell,
      ...data,
      id, // Ensure ID cannot be changed
    };

    await this.spellRepository.update(updatedSpell);
    return updatedSpell;
  }

  async deleteSpell(id: string): Promise<void> {
    const spell = await this.spellRepository.findById(id);
    if (!spell) {
      throw new AppError('Spell not found', 404);
    }

    await this.spellRepository.delete(id);
  }

  async importSpells(spells: CreateSpellRequest[]): Promise<{ importedCount: number; spells: Spell[] }> {
    if (spells.length === 0) {
      return { importedCount: 0, spells: [] };
    }

    // Validate all folders exist before starting import
    const folderIds = [...new Set(spells.map(s => s.folderId || 1))];
    for (const folderId of folderIds) {
      const exists = await this.folderRepository.exists(folderId);
      if (!exists) {
        throw new AppError(`Folder with ID ${folderId} not found`, 404);
      }
    }

    // Import all spells in a single transaction
    const importedSpells = await this.transactionService.executeTransaction(async (tx) => {
      const results: Spell[] = [];

      for (const spellData of spells) {
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
          sourcePage: spellData.sourcePage || 0,
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

    return {
      importedCount: importedSpells.length,
      spells: importedSpells,
    };
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
