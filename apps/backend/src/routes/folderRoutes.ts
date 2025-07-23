import { Router } from 'express';
import { FolderController } from '../controllers/FolderController.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { schemas } from '@repo/validation';

export function createFolderRoutes(folderController: FolderController): Router {
  const router = Router();

  // GET /api/folders
  router.get('/', folderController.getAllFolders);

  // GET /api/folders/:id/contents
  router.get(
    '/:id/contents',
    validateParams(schemas.FolderIdParam),
    folderController.getFolderContents
  );

  // POST /api/folders
  router.post(
    '/',
    validateBody(schemas.CreateFolder),
    folderController.createFolder
  );

  // PATCH /api/folders/:id/rename
  router.patch(
    '/:id/rename',
    validateParams(schemas.FolderIdParam),
    validateBody(schemas.RenameFolderBody),
    folderController.renameFolder
  );

  // PATCH /api/folders/:id/move
  router.patch(
    '/:id/move',
    validateParams(schemas.FolderIdParam),
    validateBody(schemas.MoveFolderBody),
    folderController.moveFolder
  );

  // DELETE /api/folders/:id
  router.delete(
    '/:id',
    validateParams(schemas.FolderIdParam),
    validateBody(schemas.DeleteFolderBody),
    folderController.deleteFolder
  );

  return router;
}
