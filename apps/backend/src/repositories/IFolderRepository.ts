import type { Folder, FolderWithPath, FolderContents } from '@repo/types';

export interface IFolderRepository {
  findAll(): Promise<FolderWithPath[]>;
  findById(id: number): Promise<Folder | null>;
  findByPath(path: string): Promise<Folder | null>;
  create(name: string, parentId: number | null): Promise<number>;
  delete(id: number): Promise<void>;
  rename(id: number, newName: string): Promise<void>;
  move(id: number, newParentId: number | null): Promise<void>;
  exists(id: number): Promise<boolean>;
  getPath(id: number): Promise<string>;
  hasSpells(id: number): Promise<boolean>;
  hasSubfolders(id: number): Promise<boolean>;
  isEmpty(id: number): Promise<boolean>;
  getFolderContents(id: number): Promise<FolderContents>;
  deleteRecursive(id: number): Promise<void>;
  moveContentsToParent(id: number): Promise<void>;
}
