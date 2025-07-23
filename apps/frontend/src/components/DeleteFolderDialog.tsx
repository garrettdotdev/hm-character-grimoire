import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { FolderContents } from '@repo/types';

interface DeleteFolderDialogProps {
  folderId: number;
  folderName: string;
  onDelete: (strategy: 'move-to-parent' | 'recursive') => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteFolderDialog({
  folderId,
  folderName,
  onDelete,
  onCancel,
  loading = false,
}: DeleteFolderDialogProps) {
  const [folderContents, setFolderContents] = useState<FolderContents | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<'move-to-parent' | 'recursive' | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState("");
  const [loadingContents, setLoadingContents] = useState(true);

  // Fetch folder contents when dialog opens
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoadingContents(true);

        // Use the API client with new RESTful route
        const contents = await api.getFolderContents(folderId);
        setFolderContents(contents);
      } catch (error) {
        console.error("Failed to fetch folder contents:", error);
        setError("Failed to load folder contents. Please try again.");
      } finally {
        setLoadingContents(false);
      }
    };

    fetchContents();
  }, [folderId]);

  // Reset confirmation text when strategy changes
  useEffect(() => {
    setConfirmationText("");
    setError("");
  }, [selectedStrategy]);

  const getParentFolderName = () => {
    // For now, just return "parent folder" since we'd need the full folder tree to determine the exact parent name
    // This could be enhanced by passing the parent folder info as a prop
    return "parent folder";
  };

  const isDeleteEnabled = () => {
    if (!selectedStrategy) return false;
    if (selectedStrategy === 'recursive') {
      return confirmationText.trim() === folderName.trim();
    }
    return true; // move-to-parent doesn't require confirmation text
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStrategy) {
      setError("Please select a deletion option");
      return;
    }

    if (!isDeleteEnabled()) {
      if (selectedStrategy === 'recursive') {
        setError("Please type the folder name exactly as shown");
      }
      return;
    }

    try {
      await onDelete(selectedStrategy);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      setError("Failed to delete folder. Please try again.");
    }
  };

  const handleInputChange = (value: string) => {
    setConfirmationText(value);
    if (error && value) {
      setError("");
    }
  };

  if (loadingContents) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-center">
            <div className="text-white">Loading folder contents...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!folderContents) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
        <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="text-center">
            <div className="text-red-400 mb-4">Failed to load folder contents</div>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Delete Folder</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Folder Info */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-medium text-white mb-2">
              Folder: <span className="text-blue-400">{folderName}</span>
            </h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Direct contents: {folderContents.spellCount} spells, {folderContents.subfolderCount} subfolders</div>
              <div>Total (including subfolders): {folderContents.totalSpellsRecursive} spells, {folderContents.totalSubfoldersRecursive} subfolders</div>
            </div>
          </div>

          {/* Deletion Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">How would you like to handle the folder contents?</h3>
            
            {/* Option 1: Move to Parent */}
            <label className="flex items-start gap-3 p-4 border border-gray-600 rounded cursor-pointer hover:border-gray-500 transition-colors">
              <input
                type="radio"
                name="strategy"
                value="move-to-parent"
                checked={selectedStrategy === 'move-to-parent'}
                onChange={(e) => setSelectedStrategy(e.target.value as 'move-to-parent')}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="text-white font-medium">Move contents to parent folder</div>
                <div className="text-sm text-gray-400 mt-1">
                  All spells and subfolders will be moved to "{getParentFolderName()}" and the empty folder will be deleted.
                  This preserves all your data.
                </div>
              </div>
            </label>

            {/* Option 2: Delete Everything */}
            <label className="flex items-start gap-3 p-4 border border-gray-600 rounded cursor-pointer hover:border-gray-500 transition-colors">
              <input
                type="radio"
                name="strategy"
                value="recursive"
                checked={selectedStrategy === 'recursive'}
                onChange={(e) => setSelectedStrategy(e.target.value as 'recursive')}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="text-red-400 font-medium">Delete folder and all contents</div>
                <div className="text-sm text-gray-400 mt-1">
                  ⚠️ This will permanently delete the folder, all {folderContents.totalSpellsRecursive} spells, 
                  and all {folderContents.totalSubfoldersRecursive} subfolders. This action cannot be undone.
                </div>
              </div>
            </label>
          </div>

          {/* Confirmation Input for Recursive Delete */}
          {selectedStrategy === 'recursive' && (
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-300 mb-2">
                Type the folder name to confirm deletion:
              </label>
              <div className="mb-2">
                <code className="bg-gray-700 px-2 py-1 rounded text-sm text-white">
                  {folderName}
                </code>
              </div>
              <input
                type="text"
                id="confirmation"
                value={confirmationText}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-red-500 ${
                  error ? "border-red-500" : "border-gray-600"
                }`}
                placeholder="Type folder name here"
                disabled={loading}
                autoComplete="off"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isDeleteEnabled() || loading}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedStrategy === 'recursive'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Deleting...' : selectedStrategy === 'recursive' ? 'Delete Everything' : 'Move & Delete Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
