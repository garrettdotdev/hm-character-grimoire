import { useState, useEffect } from "react";
import type { Character } from "../types";

interface DeleteCharacterDialogProps {
  character: Character;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteCharacterDialog({
  character,
  onDelete,
  onCancel,
  loading = false,
}: DeleteCharacterDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState("");

  // Reset confirmation text when character changes
  useEffect(() => {
    setConfirmationText("");
    setError("");
  }, [character.id]);

  const isDeleteEnabled = confirmationText.trim() === character.name.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDeleteEnabled) {
      setError("Please type the character name exactly as shown");
      return;
    }

    try {
      await onDelete();
    } catch (error) {
      console.error("Failed to delete character:", error);
      setError("Failed to delete character. Please try again.");
    }
  };

  const handleInputChange = (value: string) => {
    setConfirmationText(value);
    if (error) {
      setError("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Warning message */}
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-red-400 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-red-400 font-medium mb-1">Delete Character</h3>
            <p className="text-red-300 text-sm">
              Are you certain you want to delete{" "}
              <strong>{character.name}</strong>?
            </p>
            <p className="text-red-300 text-sm mt-2">
              This action cannot be undone. The character will be permanently
              removed from your grimoire.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation input */}
      <div>
        <label
          htmlFor="confirmation"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Type the character name to confirm deletion:
        </label>
        <div className="mb-2">
          <code className="bg-gray-700 px-2 py-1 rounded text-sm text-white">
            {character.name}
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
          placeholder="Type character name here"
          disabled={loading}
          autoComplete="off"
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!isDeleteEnabled || loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {loading ? "Deleting..." : "Delete Character"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
