import { prismaService } from '../services/PrismaService.js';
import type { Folder, FolderWithPath, FolderContents } from '@repo/types';
import type { IFolderRepository } from './IFolderRepository.js';

export class PrismaFolderRepository implements IFolderRepository {
  private get prisma() {
    return prismaService.prisma;
  }

  async findAll(): Promise<FolderWithPath[]> {
    const folders = await this.prisma.folder.findMany({
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true // Support up to 4 levels deep
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return this.buildFolderTree(folders);
  }

  async findById(id: number): Promise<Folder | null> {
    const folder = await this.prisma.folder.findUnique({
      where: { id }
    });

    return folder ? this.mapToFolder(folder) : null;
  }

  async findByPath(path: string): Promise<Folder | null> {
    if (path === '/') {
      return this.findById(1); // Root folder
    }

    const parts = path.split('/').filter(p => p);
    let currentId = 1; // Start from root

    for (const part of parts) {
      const folder = await this.prisma.folder.findFirst({
        where: {
          name: part,
          parentId: currentId
        }
      });
      
      if (!folder) return null;
      currentId = folder.id;
    }

    return this.findById(currentId);
  }

  async create(name: string, parentId: number | null): Promise<number> {
    const folder = await this.prisma.folder.create({
      data: {
        name,
        parentId: parentId || null
      }
    });
    return folder.id;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.folder.delete({
      where: { id }
    });
  }

  async rename(id: number, newName: string): Promise<void> {
    await this.prisma.folder.update({
      where: { id },
      data: { name: newName }
    });
  }

  async move(id: number, newParentId: number | null): Promise<void> {
    await this.prisma.folder.update({
      where: { id },
      data: { parentId: newParentId }
    });
  }

  async exists(id: number): Promise<boolean> {
    const folder = await this.prisma.folder.findUnique({
      where: { id }
    });
    return !!folder;
  }

  async getPath(id: number): Promise<string> {
    if (id === 1) return '/'; // Root folder

    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        parent: {
          include: {
            parent: {
              include: {
                parent: true // Support up to 4 levels deep
              }
            }
          }
        }
      }
    });

    if (!folder) return '/';

    const parts: string[] = [];
    let current = folder;

    while (current && current.parentId !== null) {
      parts.unshift(current.name);
      current = current.parent as any;
    }

    return '/' + parts.join('/');
  }

  async hasSpells(id: number): Promise<boolean> {
    const count = await this.prisma.spell.count({
      where: { folderId: id }
    });
    return count > 0;
  }

  async hasSubfolders(id: number): Promise<boolean> {
    const count = await this.prisma.folder.count({
      where: { parentId: id }
    });
    return count > 0;
  }

  async isEmpty(id: number): Promise<boolean> {
    const hasSpells = await this.hasSpells(id);
    const hasSubfolders = await this.hasSubfolders(id);
    return !hasSpells && !hasSubfolders;
  }

  async getFolderContents(id: number): Promise<FolderContents> {
    // Get direct spell count
    const spellCount = await this.prisma.spell.count({
      where: { folderId: id }
    });

    // Get direct subfolders
    const subfolders = await this.prisma.folder.findMany({
      where: { parentId: id },
      orderBy: { name: 'asc' }
    });

    const subfoldersWithPath = await Promise.all(
      subfolders.map(async (folder) => {
        const path = await this.getPath(folder.id);
        return {
          ...this.mapToFolder(folder),
          path,
          children: []
        };
      })
    );

    // Get recursive counts using raw SQL for better performance
    const recursiveSpellCount = await this.prisma.$queryRaw<[{ count: number }]>`
      WITH RECURSIVE folder_tree AS (
        SELECT id FROM folders WHERE id = ${id}
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      SELECT COUNT(*) as count FROM spells s
      INNER JOIN folder_tree ft ON s.folder_id = ft.id
    `;

    const recursiveSubfolderCount = await this.prisma.$queryRaw<[{ count: number }]>`
      WITH RECURSIVE folder_tree AS (
        SELECT id FROM folders WHERE parent_id = ${id}
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      SELECT COUNT(*) as count FROM folder_tree
    `;

    return {
      spellCount,
      subfolderCount: subfolders.length,
      subfolders: subfoldersWithPath,
      totalSpellsRecursive: Number(recursiveSpellCount[0]?.count || 0),
      totalSubfoldersRecursive: Number(recursiveSubfolderCount[0]?.count || 0),
    };
  }

  async deleteRecursive(id: number): Promise<void> {
    // Prisma will handle cascade deletion automatically
    await this.prisma.folder.delete({
      where: { id }
    });
  }

  async moveContentsToParent(id: number): Promise<void> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: { children: true }
    });

    if (!folder) throw new Error('Folder not found');

    await this.prisma.$transaction(async (tx) => {
      // Move all spells to parent
      await tx.spell.updateMany({
        where: { folderId: id },
        data: { folderId: folder.parentId || 1 }
      });

      // Move all subfolders to parent with conflict resolution
      for (const child of folder.children) {
        let newName = child.name;
        let counter = 1;

        // Check for naming conflicts
        while (await this.hasNameConflict(tx, newName, folder.parentId)) {
          newName = `${child.name}_${counter}`;
          counter++;
        }

        await tx.folder.update({
          where: { id: child.id },
          data: {
            parentId: folder.parentId,
            name: newName
          }
        });
      }

      // Delete the empty folder
      await tx.folder.delete({
        where: { id }
      });
    });
  }

  private async hasNameConflict(tx: any, name: string, parentId: number | null): Promise<boolean> {
    const count = await tx.folder.count({
      where: {
        name,
        parentId
      }
    });
    return count > 0;
  }

  private mapToFolder(folder: any): Folder {
    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      createdAt: folder.createdAt.toISOString(),
    };
  }

  private async buildFolderTree(folders: any[]): Promise<FolderWithPath[]> {
    const result: FolderWithPath[] = [];

    const processFolder = async (folder: any): Promise<FolderWithPath> => {
      const path = await this.getPath(folder.id);
      const children = folder.children ? await Promise.all(folder.children.map(processFolder)) : [];

      return {
        ...this.mapToFolder(folder),
        path,
        children: children.sort((a, b) => a.name.localeCompare(b.name))
      };
    };

    for (const folder of folders) {
      if (folder.parentId === null) { // Root folders
        result.push(await processFolder(folder));
      }
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }
}
