import type { IFolderRepository } from '../repositories/IFolderRepository.js';
import type { ISpellRepository } from '../repositories/ISpellRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import type { FolderWithPath, FolderContents } from '@repo/types';

export class FolderService {
  constructor(
    private folderRepository: IFolderRepository,
    private spellRepository: ISpellRepository
  ) {}

  async getAllFolders(): Promise<FolderWithPath[]> {
    return await this.folderRepository.findAll();
  }

  async createFolder(name: string, parentId: number | null = 1): Promise<number> {
    // Validate folder name
    if (!name || name.trim() === '') {
      throw new AppError('Folder name cannot be empty', 400);
    }

    if (name.includes('/')) {
      throw new AppError('Folder name cannot contain slashes', 400);
    }

    // Check if parent exists (unless it's root)
    if (parentId !== null && parentId !== 1) {
      const parentExists = await this.folderRepository.exists(parentId);
      if (!parentExists) {
        throw new AppError('Parent folder not found', 404);
      }
    }

    // Check for naming conflicts (more efficient than loading all folders)
    const siblings = await this.getSiblingFolders(parentId);
    const hasConflict = siblings.some(folder => folder.name === name);

    if (hasConflict) {
      throw new AppError('A folder with this name already exists in the parent folder', 409);
    }

    return await this.folderRepository.create(name, parentId);
  }

  async getFolderContents(id: number): Promise<FolderContents> {
    // Check if folder exists
    const exists = await this.folderRepository.exists(id);
    if (!exists) {
      throw new AppError('Folder not found', 404);
    }

    return await this.folderRepository.getFolderContents(id);
  }

  async deleteFolder(id: number, strategy: 'empty-only' | 'move-to-parent' | 'recursive' = 'empty-only'): Promise<void> {
    if (id === 1) {
      throw new AppError('Cannot delete root folder', 400);
    }

    // Check if folder exists
    const exists = await this.folderRepository.exists(id);
    if (!exists) {
      throw new AppError('Folder not found', 404);
    }

    switch (strategy) {
      case 'empty-only':
        // Original behavior - only delete if empty
        const isEmpty = await this.folderRepository.isEmpty(id);
        if (!isEmpty) {
          throw new AppError('Cannot delete non-empty folder', 400);
        }
        await this.folderRepository.delete(id);
        break;

      case 'move-to-parent':
        // Move all contents to parent folder, then delete
        await this.folderRepository.moveContentsToParent(id);
        break;

      case 'recursive':
        // Delete folder and all contents recursively
        await this.folderRepository.deleteRecursive(id);
        break;

      default:
        throw new AppError('Invalid deletion strategy', 400);
    }
  }

  async renameFolder(id: number, newName: string): Promise<void> {
    if (id === 1) {
      throw new AppError('Cannot rename root folder', 400);
    }

    // Validate new name
    if (!newName || newName.trim() === '') {
      throw new AppError('Folder name cannot be empty', 400);
    }

    if (newName.includes('/')) {
      throw new AppError('Folder name cannot contain slashes', 400);
    }

    // Check if folder exists
    const folder = await this.folderRepository.findById(id);
    if (!folder) {
      throw new AppError('Folder not found', 404);
    }

    // Check for naming conflicts in the same parent
    const siblings = await this.getSiblingFolders(folder.parentId);
    const hasConflict = siblings.some(sibling =>
      sibling.name === newName && sibling.id !== id
    );

    if (hasConflict) {
      throw new AppError('A folder with this name already exists in the parent folder', 409);
    }

    await this.folderRepository.rename(id, newName);
  }

  async moveFolder(id: number, newParentId: number | null): Promise<void> {
    if (id === 1) {
      throw new AppError('Cannot move root folder', 400);
    }

    // Check if source folder exists
    const folder = await this.folderRepository.findById(id);
    if (!folder) {
      throw new AppError('Source folder not found', 404);
    }

    // Check if target parent exists (unless it's root)
    if (newParentId !== null && newParentId !== 1) {
      const parentExists = await this.folderRepository.exists(newParentId);
      if (!parentExists) {
        throw new AppError('Target parent folder not found', 404);
      }
    }

    // Prevent moving folder into itself or its descendants
    if (newParentId !== null && await this.isDescendant(newParentId, id)) {
      throw new AppError('Cannot move folder into itself or its descendant', 400);
    }

    // Check for naming conflicts in the target parent
    const allFolders = await this.folderRepository.findAll();
    const hasConflict = allFolders.some(f =>
      f.name === folder.name && f.parentId === newParentId && f.id !== id
    );

    if (hasConflict) {
      throw new AppError('A folder with this name already exists in the target parent folder', 409);
    }

    await this.folderRepository.move(id, newParentId);
  }

  private async isDescendant(potentialDescendantId: number, ancestorId: number): Promise<boolean> {
    const allFolders = await this.folderRepository.findAll();

    let currentId: number | null = potentialDescendantId;
    while (currentId !== null) {
      const folder = allFolders.find(f => f.id === currentId);
      if (!folder) break;

      if (folder.parentId === ancestorId) {
        return true;
      }

      currentId = folder.parentId;
    }

    return false;
  }

  async folderExists(id: number): Promise<boolean> {
    return await this.folderRepository.exists(id);
  }

  async isFolderEmpty(id: number): Promise<boolean> {
    return await this.folderRepository.isEmpty(id);
  }

  async getFolderById(id: number) {
    return await this.folderRepository.findById(id);
  }

  async getFolderByPath(path: string) {
    return await this.folderRepository.findByPath(path);
  }

  private async getSiblingFolders(parentId: number | null): Promise<{ id: number; name: string; parentId: number | null }[]> {
    const allFolders = await this.folderRepository.findAll();
    return allFolders.filter(folder => folder.parentId === parentId);
  }
}
