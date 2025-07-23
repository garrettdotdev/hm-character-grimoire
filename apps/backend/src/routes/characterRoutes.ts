import { Router } from 'express';
import { CharacterController } from '../controllers/CharacterController.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { schemas } from '@repo/validation';

export function createCharacterRoutes(characterController: CharacterController): Router {
  const router = Router();

  // GET /api/characters
  router.get('/', characterController.getAllCharacters);

  // GET /api/characters/:id
  router.get(
    '/:id',
    validateParams(schemas.UuidParam),
    characterController.getCharacter
  );

  // POST /api/characters
  router.post(
    '/',
    validateBody(schemas.CreateCharacter),
    characterController.createCharacter
  );

  // PUT /api/characters/:id
  router.put(
    '/:id',
    validateParams(schemas.UuidParam),
    validateBody(schemas.UpdateCharacter),
    characterController.updateCharacter
  );

  // DELETE /api/characters/:id
  router.delete(
    '/:id',
    validateParams(schemas.UuidParam),
    characterController.deleteCharacter
  );

  // GET /api/characters/:id/spells
  router.get(
    '/:id/spells',
    validateParams(schemas.UuidParam),
    characterController.getCharacterSpells
  );

  // POST /api/characters/:id/spells
  router.post(
    '/:id/spells',
    validateParams(schemas.UuidParam),
    validateBody(schemas.AddSpellToCharacter),
    characterController.addSpellToCharacter
  );

  // DELETE /api/characters/:id/spells/:spellId
  router.delete(
    '/:id/spells/:spellId',
    validateParams(schemas.CharacterSpellParam),
    characterController.removeSpellFromCharacter
  );

  return router;
}
