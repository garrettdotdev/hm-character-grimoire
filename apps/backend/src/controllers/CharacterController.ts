import { Response } from 'express';
import { CharacterService } from '../services/CharacterService.js';
import { ValidatedRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharacterImportRequest,
} from '@repo/types';

export class CharacterController {
  constructor(private characterService: CharacterService) {}

  getAllCharacters = asyncHandler(async (req: ValidatedRequest, res: Response) => {
    const characters = await this.characterService.getAllCharacters();
    res.json({ characters });
  });

  getCharacter = asyncHandler(async (req: ValidatedRequest<any, { id: string }>, res: Response) => {
    const character = await this.characterService.getCharacterById(req.params.id);
    res.json(character);
  });

  createCharacter = asyncHandler(async (req: ValidatedRequest<CreateCharacterRequest>, res: Response) => {
    const character = await this.characterService.createCharacter(req.body);
    res.status(201).json(character);
  });

  updateCharacter = asyncHandler(async (
    req: ValidatedRequest<UpdateCharacterRequest, { id: string }>,
    res: Response
  ) => {
    const character = await this.characterService.updateCharacter(req.params.id, req.body);
    res.json(character);
  });

  deleteCharacter = asyncHandler(async (req: ValidatedRequest<any, { id: string }>, res: Response) => {
    await this.characterService.deleteCharacter(req.params.id);
    res.status(204).send();
  });

  getCharacterSpells = asyncHandler(async (req: ValidatedRequest<any, { id: string }>, res: Response) => {
    const spells = await this.characterService.getCharacterSpells(req.params.id);
    res.json({ spells });
  });

  addSpellToCharacter = asyncHandler(async (
    req: ValidatedRequest<{ spellId: string }, { id: string }>,
    res: Response
  ) => {
    await this.characterService.addSpellToCharacter(req.params.id, req.body.spellId);
    res.status(201).json({ message: 'Spell added to character successfully' });
  });

  removeSpellFromCharacter = asyncHandler(async (
    req: ValidatedRequest<any, { id: string; spellId: string }>,
    res: Response
  ) => {
    await this.characterService.removeSpellFromCharacter(req.params.id, req.params.spellId);
    res.status(204).send();
  });

  importCharacters = asyncHandler(async (req: ValidatedRequest<CharacterImportRequest>, res: Response) => {
    const result = await this.characterService.importCharacters(req.body.characters);

    const response: any = {
      message: result.message,
      importedCount: result.importedCount,
      totalAttempted: result.totalAttempted,
      charactersImported: result.charactersImported,
      spellsAssigned: result.spellsAssigned,
    };

    if (result.errors && result.errors.length > 0) {
      response.errors = result.errors;
      response.errorCount = result.errors.length;

      if (result.importedCount === 0) {
        return res.status(400).json(response);
      } else {
        return res.status(207).json(response); // 207 Multi-Status for partial success
      }
    }

    res.status(201).json(response);
  });
}
