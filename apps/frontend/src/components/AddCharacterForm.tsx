import { useState, useEffect } from "react";
import { type Character, SpellConvocation, CharacterRank } from "@repo/types";
import { useFormDirty } from "../hooks/useFormDirty";

interface CharacterFormProps {
  onSave: (character: Omit<Character, "id" | "knownSpellIds">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Omit<Character, "id" | "knownSpellIds">;
  mode?: "create" | "edit";
  onDirtyChange?: (isDirty: boolean) => void;
}

export function CharacterForm({
  onSave,
  onCancel,
  loading = false,
  initialData,
  mode = "create",
  onDirtyChange,
}: CharacterFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    convocations: initialData?.convocations || [],
    rank: initialData?.rank || "",
    game: initialData?.game || "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Dirty state tracking
  const initialFormData = {
    name: initialData?.name || "",
    convocations: initialData?.convocations || [],
    rank: initialData?.rank || "",
    game: initialData?.game || "",
  };

  const { isDirty, updateData, markClean } = useFormDirty(initialFormData);

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        convocations: initialData.convocations || [],
        rank: initialData.rank || "",
        game: initialData.game || "",
      });
    }
  }, [initialData]);

  // Available convocations (excluding Neutral for characters)
  const availableConvocations = Object.values(SpellConvocation).filter(
    (conv) => conv !== SpellConvocation.NEUTRAL,
  );
  const rankOptions = Object.values(CharacterRank);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = "Character name is required";
    }
    if (!formData.convocations || formData.convocations.length === 0) {
      newErrors.convocations = "At least one convocation is required";
    }
    if (!formData.rank) {
      newErrors.rank = "Rank is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave({
        ...formData,
        rank: formData.rank as CharacterRank,
      });
      markClean(formData); // Mark form as clean after successful save
    } catch (error) {
      console.error("Failed to save character:", error);
    }
  };

  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    updateData(newFormData);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleConvocationChange = (
    convocation: SpellConvocation,
    checked: boolean,
  ) => {
    const newConvocations = checked
      ? [...formData.convocations, convocation]
      : formData.convocations.filter((c) => c !== convocation);

    const newFormData = { ...formData, convocations: newConvocations };
    setFormData(newFormData);
    updateData(newFormData);

    // Clear error when user makes a selection
    if (errors.convocations) {
      setErrors((prev) => ({ ...prev, convocations: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name field (required) */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Character Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-600"
          }`}
          placeholder="Enter character name"
          disabled={loading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Convocations field (required) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Convocations *
        </label>
        <div
          className={`space-y-2 p-3 bg-gray-700 border rounded ${
            errors.convocations ? "border-red-500" : "border-gray-600"
          }`}
        >
          {availableConvocations.map((convocation) => (
            <label
              key={convocation}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.convocations.includes(convocation)}
                onChange={(e) =>
                  handleConvocationChange(convocation, e.target.checked)
                }
                disabled={loading}
                className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white text-sm">{convocation}</span>
            </label>
          ))}
        </div>
        {errors.convocations && (
          <p className="mt-1 text-sm text-red-400">{errors.convocations}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Select all convocations this character is attuned to
        </p>
      </div>

      {/* Rank field (required) */}
      <div>
        <label
          htmlFor="rank"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Rank *
        </label>
        <select
          id="rank"
          value={formData.rank}
          onChange={(e) => handleChange("rank", e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.rank ? "border-red-500" : "border-gray-600"
          }`}
          disabled={loading}
        >
          <option value="">Select a rank</option>
          {rankOptions.map((rank) => (
            <option key={rank} value={rank}>
              {rank}
            </option>
          ))}
        </select>
        {errors.rank && (
          <p className="mt-1 text-sm text-red-400">{errors.rank}</p>
        )}
      </div>

      {/* Game field (optional) */}
      <div>
        <label
          htmlFor="game"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Game Information
        </label>
        <input
          type="text"
          id="game"
          value={formData.game}
          onChange={(e) => handleChange("game", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="Enter game information"
          disabled={loading}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {loading
            ? mode === "edit"
              ? "Updating..."
              : "Saving..."
            : mode === "edit"
              ? "Update"
              : "Save"}
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

// Backward compatibility export
export const AddCharacterForm = CharacterForm;
