import { useState, useRef, useEffect } from "react";
import { useFormDirty } from "../hooks/useFormDirty";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { ErrorModal } from "./ErrorModal";

interface CharacterImportModalProps {
  onImport: (characters: any[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function CharacterImportModal({
  onImport,
  onCancel,
  loading = false,
  onDirtyChange,
}: CharacterImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dirty state tracking
  const initialFormData = { selectedFile: null as File | null, previewData: null as any[] | null };
  const { isDirty, updateData, markClean } = useFormDirty(initialFormData);

  // Error handling
  const { errorInfo, showErrorModal, handleApiError, clearError } = useErrorHandler();

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Update dirty state when file or preview changes
  useEffect(() => {
    updateData({ selectedFile, previewData });
  }, [selectedFile, previewData, updateData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      clearFile();
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setError("Please select a JSON file");
      clearFile();
      return;
    }

    setSelectedFile(file);
    setError("");

    // Read and preview the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate basic structure
        if (!Array.isArray(data)) {
          setError("JSON file must contain an array of characters");
          setPreviewData(null);
          return;
        }

        if (data.length === 0) {
          setError("JSON file contains no characters");
          setPreviewData(null);
          return;
        }

        // Basic validation of required fields
        for (let i = 0; i < data.length; i++) {
          const char = data[i];
          if (!char.name || !char.convocations || !char.rank) {
            setError(`Character at index ${i} is missing required fields (name, convocations, rank)`);
            setPreviewData(null);
            return;
          }
          if (!Array.isArray(char.convocations)) {
            setError(`Character "${char.name}" convocations must be an array`);
            setPreviewData(null);
            return;
          }
        }

        setPreviewData(data);
        setError("");
      } catch (parseError) {
        setError("Invalid JSON file format");
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!previewData) {
      setError("No valid data to import");
      return;
    }

    try {
      await onImport(previewData);
      markClean({ selectedFile: null, previewData: null }); // Mark form as clean after successful import
    } catch (error) {
      console.error("Import failed:", error);
      handleApiError(error as any, "Failed to import characters");
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
    <div className="space-y-4">
      {/* File Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select JSON File
        </label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Choose File
          </button>
          {selectedFile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">{selectedFile.name}</span>
              <button
                type="button"
                onClick={clearFile}
                disabled={loading}
                className="text-red-400 hover:text-red-300 disabled:opacity-50"
                title="Clear file"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Preview ({previewData.length} character{previewData.length !== 1 ? 's' : ''})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {previewData.slice(0, 10).map((character, index) => (
              <div key={index} className="text-sm text-gray-400 border-b border-gray-700 pb-2">
                <div className="font-medium text-gray-300">{character.name}</div>
                <div>Convocations: {character.convocations?.join(", ") || "None"}</div>
                <div>Rank: {character.rank}</div>
                {character.game && <div>Game: {character.game}</div>}
                {character.knownSpells && character.knownSpells.length > 0 && (
                  <div>Known Spells: {character.knownSpells.length} spell{character.knownSpells.length !== 1 ? 's' : ''}</div>
                )}
              </div>
            ))}
            {previewData.length > 10 && (
              <div className="text-xs text-gray-500 italic">
                ... and {previewData.length - 10} more character{previewData.length - 10 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expected Format Info */}
      <div className="bg-gray-800 border border-gray-700 rounded p-3">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Expected JSON Format
        </h4>
        <pre className="text-xs text-gray-400 overflow-x-auto">
          {`[
  {
    "name": "Character Name",
    "convocations": ["Lyahvi", "Peleahn"],
    "rank": "Mavari",
    "game": "Campaign Name",
    "knownSpells": [
      "Spell Name 1",
      "Spell Name 2"
    ]
  }
]`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          Required fields: name, convocations, rank. Optional: game, knownSpells
        </p>
      </div>

      {/* Action Buttons */}
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
          type="button"
          onClick={handleImport}
          disabled={loading || !previewData}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm transition-colors"
        >
          {loading ? "Importing..." : "Import Characters"}
        </button>
      </div>
    </div>

    {/* Error Modal */}
    {showErrorModal && errorInfo && (
      <ErrorModal
        isOpen={showErrorModal}
        onClose={clearError}
        error={errorInfo}
      />
    )}
    </>
  );
}
