import type { Spell } from "../types";

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  spells: Spell[];
  isExpanded: boolean;
}

export interface FolderTreeState {
  [path: string]: boolean; // expanded state for each folder
}

/**
 * Builds a hierarchical folder tree from a flat list of spells and empty folders
 */
export function buildFolderTree(
  spells: Spell[],
  expandedState: FolderTreeState = {},
  emptyFolders: string[] = [],
): FolderNode {
  const root: FolderNode = {
    name: "",
    path: "/",
    children: [],
    spells: [],
    isExpanded: true,
  };

  // Group spells by folder path
  const folderMap = new Map<string, Spell[]>();

  spells.forEach((spell) => {
    const folderPath = spell.folderPath || "/";
    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, []);
    }
    folderMap.get(folderPath)!.push(spell);
  });

  // Get all unique folder paths (from spells and empty folders) and sort them
  const spellFolderPaths = Array.from(folderMap.keys());
  const allPaths = Array.from(
    new Set([...spellFolderPaths, ...emptyFolders]),
  ).sort();

  // Build the tree structure
  const nodeMap = new Map<string, FolderNode>();
  nodeMap.set("/", root);

  allPaths.forEach((path) => {
    if (path === "/") {
      // Root level spells
      root.spells = folderMap.get(path) || [];
      return;
    }

    // Create nodes for this path and all parent paths
    const pathParts = path.split("/").filter(Boolean);
    let currentPath = "";

    pathParts.forEach((part) => {
      const parentPath = currentPath || "/";
      currentPath = currentPath + "/" + part;

      if (!nodeMap.has(currentPath)) {
        const node: FolderNode = {
          name: part,
          path: currentPath,
          children: [],
          spells: [],
          isExpanded: expandedState[currentPath] ?? false,
        };

        nodeMap.set(currentPath, node);

        // Add to parent
        const parent = nodeMap.get(parentPath)!;
        parent.children.push(node);
      }
    });

    // Add spells to the final node
    const finalNode = nodeMap.get(path);
    if (finalNode) {
      finalNode.spells = folderMap.get(path) || [];
    }
  });

  // Sort children at each level
  const sortNode = (node: FolderNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.spells.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortNode);
  };

  sortNode(root);
  return root;
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
 * Checks if a folder path is empty (has no spells and no children with spells)
 */
export function isFolderEmpty(node: FolderNode): boolean {
  if (node.spells.length > 0) {
    return false;
  }

  return node.children.every((child) => isFolderEmpty(child));
}

/**
 * Gets the parent path of a given path
 */
export function getParentPath(path: string): string {
  if (path === "/") return "/";

  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === 0) return "/";

  return path.substring(0, lastSlash);
}

/**
 * Validates a folder path
 */
export function isValidFolderPath(path: string): boolean {
  if (!path) return false;
  if (path === "/") return true;

  // Must start with /
  if (!path.startsWith("/")) return false;

  // Must not end with / (unless root)
  if (path.endsWith("/")) return false;

  // Must not have empty segments
  const segments = path.split("/").filter(Boolean);
  if (segments.some((segment) => !segment.trim())) return false;

  // Must not have invalid characters (basic check)
  if (path.includes("//")) return false;

  return true;
}

/**
 * Creates a new folder path by combining parent and name
 */
export function createFolderPath(
  parentPath: string,
  folderName: string,
): string {
  const cleanName = folderName.trim();
  if (!cleanName) return parentPath;

  if (parentPath === "/") {
    return "/" + cleanName;
  }

  return parentPath + "/" + cleanName;
}
