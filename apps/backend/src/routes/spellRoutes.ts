import { Router } from 'express';
import { SpellController } from '../controllers/SpellController.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import { schemas } from '@repo/validation';

export function createSpellRoutes(spellController: SpellController): Router {
  const router = Router();

  // GET /api/spells
  router.get('/', spellController.getAllSpells);

  // GET /api/spells/search?q=query (must come before /:id)
  router.get(
    '/search',
    validateQuery(schemas.SearchQuery),
    spellController.searchSpells
  );

  // GET /api/spells/folder/:folderId (must come before /:id)
  router.get(
    '/folder/:folderId',
    validateParams(schemas.FolderIdParam),
    spellController.getSpellsByFolder
  );

  // GET /api/spells/:id
  router.get(
    '/:id',
    validateParams(schemas.UuidParam),
    spellController.getSpell
  );

  // POST /api/spells
  router.post(
    '/',
    validateBody(schemas.CreateSpell),
    spellController.createSpell
  );

  // PUT /api/spells/:id
  router.put(
    '/:id',
    validateParams(schemas.UuidParam),
    validateBody(schemas.UpdateSpell),
    spellController.updateSpell
  );

  // DELETE /api/spells/:id
  router.delete(
    '/:id',
    validateParams(schemas.UuidParam),
    spellController.deleteSpell
  );

  // POST /api/spells/import
  router.post(
    '/import',
    validateBody(schemas.SpellImport),
    spellController.importSpells
  );

  // PATCH /api/spells/:id/move
  router.patch(
    '/:id/move',
    validateParams(schemas.UuidParam),
    validateBody(schemas.MoveSpell),
    spellController.moveSpell
  );

  return router;
}
