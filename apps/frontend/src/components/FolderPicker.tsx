import { useState } from "react";
import type { FolderWithPath } from "@repo/types";

interface FolderPickerProps {
  value: number; // Folder ID
  onChange: (folderId: number) => void;
  disabled?: boolean;
  folders: FolderWithPath[]; // All available folders
}

export function FolderPicker({
  value,
  onChange,
  disabled = false,
  folders,
}: FolderPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Flatten the folder tree for easier selection
  const flattenFolders = (folderList: FolderWithPath[]): FolderWithPath[] => {
    const result: FolderWithPath[] = [];

    const addFolder = (folder: FolderWithPath, depth = 0) => {
      result.push({ ...folder, name: '  '.repeat(depth) + folder.name });
      if (folder.children) {
        folder.children.forEach(child => addFolder(child, depth + 1));
      }
    };

    folderList.forEach(folder => addFolder(folder));
    return result;
  };

  const flatFolders = flattenFolders(folders);

  // Find the currently selected folder
  const selectedFolder = flatFolders.find(folder => folder.id === value);
  const displayValue = selectedFolder ? selectedFolder.path : '/';

  const handleSelectFolder = (folderId: number) => {
    onChange(folderId);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Folder Path
      </label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 text-left flex justify-between items-center"
            disabled={disabled}
          >
            <span>{displayValue === "/" ? "/ (root)" : displayValue}</span>
            <span className="text-gray-400">▼</span>
          </button>

          {/* Dropdown */}
          {showDropdown && !disabled && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
              {flatFolders.length > 0 ? (
                flatFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSelectFolder(folder.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-600 text-white text-sm border-b border-gray-600 last:border-b-0 ${
                      folder.id === value ? 'bg-gray-600' : ''
                    }`}
                  >
                    {folder.path === "/" ? "/ (root)" : folder.path}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-400 text-sm italic">
                  No folders available
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
