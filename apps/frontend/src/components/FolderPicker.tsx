import { useState } from "react";

interface FolderPickerProps {
  value: string;
  onChange: (folderPath: string) => void;
  disabled?: boolean;
  allFolders: string[]; // All existing folder paths
}

export function FolderPicker({
  value,
  onChange,
  disabled = false,
  allFolders,
}: FolderPickerProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Get unique folder paths and sort them
  const uniqueFolders = Array.from(new Set(allFolders))
    .filter((path) => path !== "/")
    .sort();

  // Add root folder
  const allFolderOptions = ["/", ...uniqueFolders];

  // Filter folders based on current input value
  const filteredFolders = allFolderOptions.filter((folder) => {
    if (!value || value === "/") return true; // Show all folders if no filter or just root
    return folder.toLowerCase().includes(value.toLowerCase());
  });

  const handleSelectFolder = (folderPath: string) => {
    onChange(folderPath);
    setShowDropdown(false);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    if (newFolderPath.trim()) {
      let cleanPath = newFolderPath.trim();

      // Ensure it starts with /
      if (!cleanPath.startsWith("/")) {
        cleanPath = "/" + cleanPath;
      }

      // Remove trailing slash unless it's root
      if (cleanPath !== "/" && cleanPath.endsWith("/")) {
        cleanPath = cleanPath.slice(0, -1);
      }

      onChange(cleanPath);
      setNewFolderPath("");
      setIsCreatingNew(false);
      setShowDropdown(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateNew();
    } else if (e.key === "Escape") {
      setIsCreatingNew(false);
      setNewFolderPath("");
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
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setShowDropdown(true); // Keep dropdown open while typing
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="/ (root)"
            disabled={disabled}
          />

          {/* Dropdown */}
          {showDropdown && !disabled && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredFolders.length > 0 ? (
                filteredFolders.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => handleSelectFolder(folder)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-600 text-white text-sm border-b border-gray-600 last:border-b-0"
                  >
                    {folder === "/" ? "/ (root)" : folder}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-400 text-sm italic">
                  No folders match "{value}"
                </div>
              )}

              {/* Create new folder option */}
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="w-full text-left px-3 py-2 hover:bg-gray-600 text-blue-400 text-sm font-medium"
              >
                + Create new folder
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
        >
          ▼
        </button>
      </div>

      {/* Create new folder input */}
      {isCreatingNew && (
        <div className="mt-2 p-3 bg-gray-800 border border-gray-600 rounded">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            New Folder Path
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g., /Combat/Offensive"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={!newFolderPath.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setNewFolderPath("");
              }}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Use Linux-style paths. Examples: /Combat, /Utility/Detection,
            /Advanced/Rituals
          </p>
        </div>
      )}

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
