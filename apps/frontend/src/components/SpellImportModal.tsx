import { useState, useRef, useEffect } from "react";
import { useFormDirty } from "../hooks/useFormDirty";

interface SpellImportModalProps {
  onImport: (spells: any[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function SpellImportModal({
  onImport,
  onCancel,
  loading = false,
  onDirtyChange,
}: SpellImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dirty state tracking
  const initialFormData = { selectedFile: null, previewData: null };
  const { isDirty, updateData, markClean } = useFormDirty(initialFormData);

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Update dirty state when file or preview data changes
  useEffect(() => {
    updateData({ selectedFile, previewData });
  }, [selectedFile, previewData, updateData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewData(null);
      setError("");
      return;
    }

    if (file.type !== "application/json") {
      setError("Please select a JSON file");
      setSelectedFile(null);
      setPreviewData(null);
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
          setError("JSON file must contain an array of spells");
          setPreviewData(null);
          return;
        }

        if (data.length === 0) {
          setError("JSON file contains no spells");
          setPreviewData(null);
          return;
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
      setError("Import failed. Please check the file format and try again.");
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
                className="text-red-400 hover:text-red-300 text-sm"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Preview ({previewData.length} spells)
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {previewData.slice(0, 10).map((spell, index) => (
              <div
                key={index}
                className="text-xs text-gray-400 flex justify-between"
              >
                <span>{spell.name || "Unnamed"}</span>
                <span>{spell.convocation || "No convocation"}</span>
              </div>
            ))}
            {previewData.length > 10 && (
              <div className="text-xs text-gray-500 italic">
                ... and {previewData.length - 10} more spells
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
    "name": "Spell Name",
    "convocation": "Lyahvi",
    "complexityLevel": 1,
    "description": "Spell description",
    "bonusEffects": [
      {
        "masteryLevelMinimum": 1,
        "effectsDescription": "Effect description"
      }
    ],
    "castingTime": "1 action",
    "range": "Touch",
    "duration": "Instantaneous",
    "folderPath": "/",
    "sourceBook": "Book Name",
    "sourcePage": 123
  }
]`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          Required fields: name, convocation, complexityLevel, description
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
          {loading ? "Importing..." : "Import Spells"}
        </button>
      </div>
    </div>
  );
}
