import { BaseRepository } from './BaseRepository.js';
import type { Folder, FolderWithPath, FolderContents } from '@repo/types';
import type { IFolderRepository } from './IFolderRepository.js';

export class FolderRepository extends BaseRepository implements IFolderRepository {
  async findAll(): Promise<FolderWithPath[]> {
    const rows = await this.runQueryAll<{
      id: number;
      name: string;
      parent_id: number | null;
      created_at: string;
    }>('SELECT * FROM folders ORDER BY name');

    const folders = rows.map(this.rowToFolder);
    return this.buildFolderTree(folders);
  }

  async findById(id: number): Promise<Folder | null> {
    const row = await this.runQuery<{
      id: number;
      name: string;
      parent_id: number | null;
      created_at: string;
    }>('SELECT * FROM folders WHERE id = ?', [id]);

    return row ? this.rowToFolder(row) : null;
  }

  async findByPath(path: string): Promise<Folder | null> {
    if (path === '/') {
      return this.findById(1); // Root folder
    }

    const parts = path.split('/').filter(p => p);
    let currentId = 1; // Start from root

    for (const part of parts) {
      const row = await this.runQuery<{ id: number }>(
        'SELECT id FROM folders WHERE name = ? AND parent_id = ?',
        [part, currentId]
      );

      if (!row) return null;
      currentId = row.id;
    }

    return this.findById(currentId);
  }

  async create(name: string, parentId: number | null): Promise<number> {
    return await this.runStatementWithLastID(
      'INSERT INTO folders (name, parent_id) VALUES (?, ?)',
      [name, parentId]
    );
  }

  async delete(id: number): Promise<void> {
    await this.runStatement(
      'DELETE FROM folders WHERE id = ?',
      [id]
    );
  }

  async rename(id: number, newName: string): Promise<void> {
    await this.runStatement(
      'UPDATE folders SET name = ? WHERE id = ?',
      [newName, id]
    );
  }

  async move(id: number, newParentId: number | null): Promise<void> {
    await this.runStatement(
      'UPDATE folders SET parent_id = ? WHERE id = ?',
      [newParentId, id]
    );
  }

  async exists(id: number): Promise<boolean> {
    const row = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM folders WHERE id = ?',
      [id]
    );
    return row ? row.count > 0 : false;
  }

  async getPath(id: number): Promise<string> {
    if (id === 1) return '/'; // Root folder

    const parts: string[] = [];
    let currentId = id;

    while (currentId !== 1) {
      const row = await this.runQuery<{ name: string; parent_id: number | null }>(
        'SELECT name, parent_id FROM folders WHERE id = ?',
        [currentId]
      );

      if (!row || row.parent_id === null) break;
      parts.unshift(row.name);
      currentId = row.parent_id;
    }

    return '/' + parts.join('/');
  }

  async hasSpells(id: number): Promise<boolean> {
    const row = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM spells WHERE folder_id = ?',
      [id]
    );
    return row ? row.count > 0 : false;
  }

  async hasSubfolders(id: number): Promise<boolean> {
    const row = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM folders WHERE parent_id = ?',
      [id]
    );
    return row ? row.count > 0 : false;
  }

  async isEmpty(id: number): Promise<boolean> {
    const hasSpells = await this.hasSpells(id);
    const hasSubfolders = await this.hasSubfolders(id);
    return !hasSpells && !hasSubfolders;
  }

  async getFolderContents(id: number): Promise<FolderContents> {
    // Get direct spell count
    const spellCountRow = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM spells WHERE folder_id = ?',
      [id]
    );
    const spellCount = spellCountRow?.count || 0;

    // Get direct subfolders
    const subfolderRows = await this.runQueryAll<{
      id: number;
      name: string;
      parent_id: number | null;
      created_at: string;
    }>('SELECT * FROM folders WHERE parent_id = ? ORDER BY name', [id]);

    const subfolders = await Promise.all(
      subfolderRows.map(async (row) => {
        const folder = this.rowToFolder(row);
        const path = await this.getPath(folder.id);
        return { ...folder, path, children: [] };
      })
    );

    // Get recursive counts using WITH RECURSIVE
    const recursiveSpellCountRow = await this.runQuery<{ count: number }>(
      `WITH RECURSIVE folder_tree AS (
        SELECT id FROM folders WHERE id = ?
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      SELECT COUNT(*) as count FROM spells s
      INNER JOIN folder_tree ft ON s.folder_id = ft.id`,
      [id]
    );
    const totalSpellsRecursive = recursiveSpellCountRow?.count || 0;

    const recursiveSubfolderCountRow = await this.runQuery<{ count: number }>(
      `WITH RECURSIVE folder_tree AS (
        SELECT id FROM folders WHERE parent_id = ?
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      SELECT COUNT(*) as count FROM folder_tree`,
      [id]
    );
    const totalSubfoldersRecursive = recursiveSubfolderCountRow?.count || 0;

    return {
      spellCount,
      subfolderCount: subfolders.length,
      subfolders,
      totalSpellsRecursive,
      totalSubfoldersRecursive,
    };
  }

  async deleteRecursive(id: number): Promise<void> {
    // Delete all spells in this folder and subfolders using recursive CTE
    await this.runStatement(
      `WITH RECURSIVE folder_tree AS (
        SELECT id FROM folders WHERE id = ?
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      DELETE FROM spells WHERE folder_id IN (SELECT id FROM folder_tree)`,
      [id]
    );

    // Delete all subfolders (CASCADE will handle the hierarchy)
    await this.runStatement(
      'DELETE FROM folders WHERE id = ?',
      [id]
    );
  }

  async moveContentsToParent(id: number): Promise<void> {
    const folder = await this.findById(id);
    if (!folder) throw new Error('Folder not found');

    await this.runTransaction([
      async () => {
        // Move all spells in this folder to parent
        await this.runStatement(
          'UPDATE spells SET folder_id = ? WHERE folder_id = ?',
          [folder.parentId, id]
        );
      },
      async () => {
        // Move all direct subfolders to parent with conflict resolution
        const subfolders = await this.runQueryAll<{
          id: number;
          name: string;
          parent_id: number | null;
          created_at: string;
        }>('SELECT * FROM folders WHERE parent_id = ?', [id]);

        for (const subfolder of subfolders) {
          let newName = subfolder.name;
          let counter = 1;

          // Handle naming conflicts by adding a suffix
          while (await this.hasNameConflict(newName, folder.parentId)) {
            newName = `${subfolder.name}_${counter}`;
            counter++;
          }

          // Update the folder's parent and name if needed
          await this.runStatement(
            'UPDATE folders SET parent_id = ?, name = ? WHERE id = ?',
            [folder.parentId, newName, subfolder.id]
          );
        }
      },
      async () => {
        // Finally delete the empty folder
        await this.runStatement(
          'DELETE FROM folders WHERE id = ?',
          [id]
        );
      },
    ]);
  }

  private async hasNameConflict(name: string, parentId: number | null): Promise<boolean> {
    const row = await this.runQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM folders WHERE name = ? AND parent_id = ?',
      [name, parentId]
    );
    return row ? row.count > 0 : false;
  }

  private rowToFolder(row: {
    id: number;
    name: string;
    parent_id: number | null;
    created_at: string;
  }): Folder {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
    };
  }

  private async buildFolderTree(folders: Folder[]): Promise<FolderWithPath[]> {
    const folderMap = new Map<number, FolderWithPath>();
    const rootFolders: FolderWithPath[] = [];

    // Convert folders to FolderWithPath and build map
    for (const folder of folders) {
      const path = await this.getPath(folder.id);
      const folderWithPath: FolderWithPath = {
        ...folder,
        path,
        children: [],
      };
      folderMap.set(folder.id, folderWithPath);
    }

    // Build tree structure
    for (const folder of folderMap.values()) {
      if (folder.parentId === null) {
        rootFolders.push(folder);
      } else {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(folder);
        }
      }
    }

    return rootFolders;
  }
}
