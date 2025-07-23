import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFormDirty } from "../hooks/useFormDirty";
import type { FolderWithPath } from "@repo/types";

interface AddFolderModalProps {
  onSave: (name: string, parentId: number) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  allFolders: FolderWithPath[];
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface AddFolderModalRef {
  save: () => Promise<void>;
}

export const AddFolderModal = forwardRef<AddFolderModalRef, AddFolderModalProps>(({
  onSave,
  onCancel,
  loading = false,
  allFolders,
  onDirtyChange,
}, ref) => {
  const [folderName, setFolderName] = useState("");
  const [parentId, setParentId] = useState<number>(1); // Default to root
  const [error, setError] = useState("");

  // Dirty state tracking
  const initialFormData = { folderName: "", parentId: 1 };
  const { isDirty, updateData, markClean } = useFormDirty(initialFormData);

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    // Clear error when user starts typing
    if (error && folderName) {
      setError("");
    }
    // Update dirty state
    updateData({ folderName, parentId });
  }, [folderName, parentId, error, updateData]);

  const validateFolderName = (name: string): string | null => {
    if (!name.trim()) {
      return "Folder name is required";
    }

    const cleanName = name.trim();

    // Check for invalid characters (no slashes allowed in names)
    if (cleanName.includes('/')) {
      return "Folder name cannot contain slashes";
    }

    if (!/^[a-zA-Z0-9_\-\s]+$/.test(cleanName)) {
      return "Folder name contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores.";
    }

    // Check if folder already exists in the selected parent
    const existsInParent = allFolders.some(folder =>
      folder.name === cleanName && folder.parentId === parentId
    );

    if (existsInParent) {
      return "A folder with this name already exists in the selected parent folder";
    }



    return null;
  };

  const performSave = async () => {
    const validationError = validateFolderName(folderName);
    if (validationError) {
      setError(validationError);
      throw new Error(validationError);
    }

    const cleanName = folderName.trim();

    try {
      await onSave(cleanName, parentId);
      markClean({ folderName: cleanName, parentId }); // Mark form as clean after successful save
    } catch (error) {
      console.error("Failed to create folder:", error);
      setError("Failed to create folder. Please try again.");
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSave();
  };

  // Expose save method to parent via ref
  useImperativeHandle(ref, () => ({
    save: performSave,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="folderName"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Folder Name *
        </label>
        <input
          type="text"
          id="folderName"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            error ? "border-red-500" : "border-gray-600"
          }`}
          placeholder="e.g., Combat, Offensive, Utility"
          disabled={loading}
          autoFocus
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>

      <div>
        <label
          htmlFor="parentFolder"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Parent Folder
        </label>
        <select
          id="parentFolder"
          value={parentId}
          onChange={(e) => setParentId(Number(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          disabled={loading}
        >
          {allFolders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.path === "/" ? "/ (root)" : folder.path}
            </option>
          ))}
        </select>
      </div>



      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !folderName.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors"
        >
          {loading ? "Creating..." : "Create Folder"}
        </button>
      </div>
    </form>
  );
});
