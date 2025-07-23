import { useState, useEffect, useRef } from "react";
import type { FolderWithPath } from "@repo/types";

interface FolderPickerProps {
  value: string; // Folder path
  onChange: (folderPath: string) => void;
  disabled?: boolean;
  folders: FolderWithPath[]; // All available folders
}

export function FolderPicker({
  value,
  onChange,
  disabled = false,
  folders,
}: FolderPickerProps) {
  const [inputValue, setInputValue] = useState(value || "/");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredFolders, setFilteredFolders] = useState<FolderWithPath[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || "/");
  }, [value]);

  // Flatten the folder tree for easier selection
  const flattenFolders = (folderList: FolderWithPath[]): FolderWithPath[] => {
    const result: FolderWithPath[] = [];

    const addFolder = (folder: FolderWithPath) => {
      result.push(folder);
      if (folder.children) {
        folder.children.forEach(child => addFolder(child));
      }
    };

    folderList.forEach(folder => addFolder(folder));
    return result;
  };

  const allFolders = flattenFolders(folders);

  // Filter folders based on input value
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredFolders(allFolders);
    } else {
      const filtered = allFolders.filter(folder =>
        folder.path.toLowerCase().includes(inputValue.toLowerCase()) ||
        folder.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredFolders(filtered);
    }
  }, [inputValue, allFolders]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleSelectFolder = (folderPath: string) => {
    setInputValue(folderPath);
    onChange(folderPath);
    setShowDropdown(false);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close dropdown if clicking on dropdown item
    if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget as Node)) {
      return;
    }

    // Update the value and close dropdown
    onChange(inputValue);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Folder Path
      </label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="Enter folder path (e.g., /spells/combat)"
            disabled={disabled}
          />

          {/* Dropdown */}
          {showDropdown && !disabled && filteredFolders.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 max-h-48 overflow-y-auto"
            >
              {filteredFolders
                .sort((a, b) => {
                  // Sort with root first, then alphabetically
                  if (a.path === "/") return -1;
                  if (b.path === "/") return 1;
                  return a.path.localeCompare(b.path);
                })
                .map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSelectFolder(folder.path)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-600 text-white text-sm border-b border-gray-600 last:border-b-0 ${
                      folder.path === inputValue ? 'bg-gray-600' : ''
                    }`}
                  >
                    {folder.path === "/" ? "/ (root)" : folder.path}
                  </button>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
