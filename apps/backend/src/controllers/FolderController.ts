import { Response } from 'express';
import { FolderService } from '../services/FolderService.js';
import { ValidatedRequest } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  CreateFolderRequest,
  RenameFolderRequest,
  MoveFolderRequest,
} from '@repo/types';

export class FolderController {
  constructor(private folderService: FolderService) {}

  getAllFolders = asyncHandler(async (req: ValidatedRequest, res: Response) => {
    const folders = await this.folderService.getAllFolders();
    res.json({ folders });
  });

  createFolder = asyncHandler(async (req: ValidatedRequest<CreateFolderRequest>, res: Response) => {
    const { name, parentId = 1 } = req.body;
    const folderId = await this.folderService.createFolder(name, parentId);
    res.status(201).json({ message: 'Folder created successfully', folderId });
  });

  getFolderContents = asyncHandler(async (req: ValidatedRequest<any, { id: string }>, res: Response) => {
    const folderId = parseInt(req.params.id, 10);
    const contents = await this.folderService.getFolderContents(folderId);
    res.json(contents);
  });

  deleteFolder = asyncHandler(async (req: ValidatedRequest<{ strategy?: string }, { id: string }>, res: Response) => {
    const { strategy = 'empty-only' } = req.body;
    const folderId = parseInt(req.params.id, 10);

    await this.folderService.deleteFolder(folderId, strategy as 'empty-only' | 'move-to-parent' | 'recursive');
    res.status(204).send();
  });

  renameFolder = asyncHandler(async (req: ValidatedRequest<{ newName: string }, { id: string }>, res: Response) => {
    const { newName } = req.body;
    const folderId = parseInt(req.params.id, 10);

    await this.folderService.renameFolder(folderId, newName);
    res.json({
      message: 'Folder renamed successfully',
      folderId,
      newName,
    });
  });

  moveFolder = asyncHandler(async (req: ValidatedRequest<{ newParentId: number | null }, { id: string }>, res: Response) => {
    const { newParentId } = req.body;
    const folderId = parseInt(req.params.id, 10);

    await this.folderService.moveFolder(folderId, newParentId);
    res.json({
      message: 'Folder moved successfully',
      folderId,
      newParentId,
    });
  });
}
