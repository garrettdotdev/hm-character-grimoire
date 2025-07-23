import { Response } from 'express';
import { SpellService } from '../services/SpellService.js';
import { ValidatedRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  CreateSpellRequest,
  UpdateSpellRequest,
  SpellImportRequest,
} from '@repo/types';

export class SpellController {
  constructor(private spellService: SpellService) {}

  getAllSpells = asyncHandler(async (req: ValidatedRequest, res: Response) => {
    const spells = await this.spellService.getAllSpells();
    res.json({ spells });
  });

  getSpell = asyncHandler(async (req: ValidatedRequest<any, { id: string }>, res: Response) => {
    const spell = await this.spellService.getSpellById(req.params.id);
    res.json(spell);
  });

  createSpell = asyncHandler(async (req: ValidatedRequest<CreateSpellRequest>, res: Response) => {
    const spell = await this.spellService.createSpell(req.body);
    res.status(201).json(spell);
  });

  updateSpell = asyncHandler(async (
    req: ValidatedRequest<UpdateSpellRequest, { id: string }>,
    res: Response
  ) => {
    const spell = await this.spellService.updateSpell(req.params.id, req.body);
    res.json(spell);
  });

  deleteSpell = asyncHandler(async (req: ValidatedRequest<any, { id: string }>, res: Response) => {
    await this.spellService.deleteSpell(req.params.id);
    res.status(204).send();
  });

  importSpells = asyncHandler(async (req: ValidatedRequest<SpellImportRequest>, res: Response) => {
    const result = await this.spellService.importSpells(req.body.spells);
    res.status(201).json({
      message: `Successfully imported ${result.importedCount} spells`,
      importedCount: result.importedCount,
    });
  });

  moveSpell = asyncHandler(async (
    req: ValidatedRequest<{ folderId: number }, { id: string }>,
    res: Response
  ) => {
    const spell = await this.spellService.moveSpell(req.params.id, req.body.folderId);
    res.json(spell);
  });

  getSpellsByFolder = asyncHandler(async (
    req: ValidatedRequest<any, { folderId: string }>,
    res: Response
  ) => {
    const folderId = parseInt(req.params.folderId, 10);
    if (isNaN(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID' });
    }

    const spells = await this.spellService.getSpellsByFolder(folderId);
    res.json({ spells });
  });

  searchSpells = asyncHandler(async (
    req: ValidatedRequest<any, any, { q: string }>,
    res: Response
  ) => {
    const { q: query } = (req as any).validatedQuery || req.query;

    const spells = await this.spellService.searchSpells(query);
    res.json({ spells, query });
  });
}
