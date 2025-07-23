import type { Spell, FolderWithPath } from "@repo/types";

export interface FolderNode {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  children: FolderNode[];
  spells: Spell[];
  isExpanded: boolean;
}

export interface FolderTreeState {
  [folderId: number]: boolean; // expanded state for each folder by ID
}

/**
 * Builds a hierarchical folder tree from normalized folder data and spells
 */
export function buildFolderTree(
  folders: FolderWithPath[],
  spells: Spell[],
  expandedState: FolderTreeState = {},
): FolderNode {
  // Find the root folder (parentId === null)
  const rootFolder = folders.find(f => f.parentId === null);
  if (!rootFolder) {
    throw new Error('Root folder not found');
  }

  // Group spells by folder ID
  const spellsByFolderId = new Map<number, Spell[]>();
  spells.forEach((spell) => {
    const folderId = spell.folderId;
    if (!spellsByFolderId.has(folderId)) {
      spellsByFolderId.set(folderId, []);
    }
    spellsByFolderId.get(folderId)!.push(spell);
  });

  // Convert FolderWithPath to FolderNode recursively
  const convertToFolderNode = (folder: FolderWithPath): FolderNode => {
    const node: FolderNode = {
      id: folder.id,
      name: folder.name,
      path: folder.path,
      parentId: folder.parentId,
      children: [],
      spells: spellsByFolderId.get(folder.id) || [],
      isExpanded: expandedState[folder.id] ?? (folder.id === rootFolder.id), // Root is expanded by default
    };

    // Convert children recursively
    if (folder.children) {
      node.children = folder.children
        .map(convertToFolderNode)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Sort spells
    node.spells.sort((a, b) => a.name.localeCompare(b.name));

    return node;
  };

  return convertToFolderNode(rootFolder);
}

/**
 * Gets all folder IDs from the tree (excluding root)
 */
export function getAllFolderIds(
  node: FolderNode,
  ids: number[] = [],
): number[] {
  if (node.parentId !== null) { // Not root
    ids.push(node.id);
  }

  node.children.forEach((child) => {
    getAllFolderIds(child, ids);
  });

  return ids;
}

/**
 * Gets all folder paths from the tree (excluding root)
 */
export function getAllFolderPaths(
  node: FolderNode,
  paths: string[] = [],
): string[] {
  if (node.path !== "/") {
    paths.push(node.path);
  }

  node.children.forEach((child) => {
    getAllFolderPaths(child, paths);
  });

  return paths;
}

/**
 * Finds a folder node by ID
 */
export function findFolderById(
  node: FolderNode,
  id: number,
): FolderNode | null {
  if (node.id === id) {
    return node;
  }

  for (const child of node.children) {
    const found = findFolderById(child, id);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Checks if a folder is empty (has no spells and no children with spells)
 */
export function isFolderEmpty(node: FolderNode): boolean {
  if (node.spells.length > 0) {
    return false;
  }

  return node.children.every((child) => isFolderEmpty(child));
}

/**
 * Gets the parent folder ID for a given folder
 */
export function getParentId(node: FolderNode): number | null {
  return node.parentId;
}

/**
 * Validates a folder name
 */
export function isValidFolderName(name: string): boolean {
  if (!name || !name.trim()) return false;

  // Must not contain slashes
  if (name.includes('/')) return false;

  // Must not be just whitespace
  if (!name.trim()) return false;

  // Basic length check
  if (name.length > 255) return false;

  return true;
}

/**
 * Gets all ancestor folder IDs for a given folder
 */
export function getAncestorIds(
  node: FolderNode,
  targetId: number,
  ancestors: number[] = [],
): number[] {
  const target = findFolderById(node, targetId);
  if (!target) return ancestors;

  let current = target;
  while (current.parentId !== null) {
    ancestors.unshift(current.parentId);
    current = findFolderById(node, current.parentId)!;
  }

  return ancestors;
}

/**
 * Checks if one folder is a descendant of another
 */
export function isDescendant(
  rootNode: FolderNode,
  ancestorId: number,
  descendantId: number,
): boolean {
  const ancestors = getAncestorIds(rootNode, descendantId);
  return ancestors.includes(ancestorId);
}
