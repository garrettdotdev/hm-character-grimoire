import { useState, useEffect } from "react";
import { type BonusEffect, type Spell, SpellConvocation, type FolderWithPath } from "@repo/types";
import { FolderPicker } from "./FolderPicker";
import { RichTextEditor } from "./RichTextEditor";
import { BonusEffectEditor } from "./BonusEffectEditor";
import { useFormDirty } from "../hooks/useFormDirty";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { ErrorModal } from "./ErrorModal";

interface SpellFormProps {
  onSave: (spell: Omit<Spell, "id">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Omit<Spell, "id">;
  mode?: "create" | "edit";
  onDirtyChange?: (isDirty: boolean) => void;
  folders?: FolderWithPath[]; // Available folders for selection
}

export function SpellForm({
  onSave,
  onCancel,
  loading = false,
  initialData,
  mode = "create",
  folders = [],
  onDirtyChange,
}: SpellFormProps) {
  // Helper function to find folder path by ID
  const getFolderPathById = (folderId: number, folderList: FolderWithPath[] = folders): string => {
    const findFolder = (folders: FolderWithPath[]): string | null => {
      for (const folder of folders) {
        if (folder.id === folderId) {
          return folder.path;
        }
        if (folder.children) {
          const childResult = findFolder(folder.children);
          if (childResult) return childResult;
        }
      }
      return null;
    };
    return findFolder(folderList) || "/";
  };

  // Helper function to find folder ID by path
  const getFolderIdByPath = (folderPath: string, folderList: FolderWithPath[] = folders): number => {
    const findFolder = (folders: FolderWithPath[]): number | null => {
      for (const folder of folders) {
        if (folder.path === folderPath) {
          return folder.id;
        }
        if (folder.children) {
          const childResult = findFolder(folder.children);
          if (childResult) return childResult;
        }
      }
      return null;
    };
    return findFolder(folderList) || 1; // Default to root folder ID
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    convocation: initialData?.convocation || "",
    complexityLevel: initialData?.complexityLevel || 1,
    description: initialData?.description || "",
    bonusEffects: initialData?.bonusEffects || [],
    castingTime: initialData?.castingTime || "",
    range: initialData?.range || "",
    duration: initialData?.duration || "",
    folderPath: initialData?.folderId ? getFolderPathById(initialData.folderId, folders) : "/", // Store path instead of ID
    sourceBook: initialData?.sourceBook || "",
    sourcePage: initialData?.sourcePage || "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Error handling
  const { errorInfo, showErrorModal, handleApiError, clearError } = useErrorHandler();

  // Dirty state tracking
  const initialFormData = {
    name: initialData?.name || "",
    convocation: initialData?.convocation || "",
    complexityLevel: initialData?.complexityLevel || 1,
    description: initialData?.description || "",
    bonusEffects: initialData?.bonusEffects || [],
    castingTime: initialData?.castingTime || "",
    range: initialData?.range || "",
    duration: initialData?.duration || "",
    folderPath: initialData?.folderId ? getFolderPathById(initialData.folderId, folders) : "/", // Store path instead of ID
    sourceBook: initialData?.sourceBook || "",
    sourcePage: initialData?.sourcePage || "",
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
        convocation: initialData.convocation || "",
        complexityLevel: initialData.complexityLevel || 1,
        description: initialData.description || "",
        bonusEffects: initialData.bonusEffects || [],
        castingTime: initialData.castingTime || "",
        range: initialData.range || "",
        duration: initialData.duration || "",
        folderPath: initialData.folderId ? getFolderPathById(initialData.folderId, folders) : "/", // Store path instead of ID
        sourceBook: initialData.sourceBook || "",
        sourcePage: initialData.sourcePage || "",
      });
    }
  }, [initialData]); // Remove folders dependency to prevent form reset when folders change

  // Folders are now passed as a prop

  const convocationOptions = Object.values(SpellConvocation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = "Spell name is required";
    }
    if (!formData.convocation) {
      newErrors.convocation = "Convocation is required";
    }
    if (!formData.complexityLevel || formData.complexityLevel < 1) {
      newErrors.complexityLevel = "Complexity level must be at least 1";
    }
    // Strip Markdown formatting for validation
    const descriptionText = formData.description
      .replace(/[#*_`~[\]()]/g, "")
      .trim();
    if (!descriptionText) {
      newErrors.description = "Spell description is required";
    }

    // Validate bonus effects
    formData.bonusEffects.forEach((effect, index) => {
      if (
        !effect.masteryLevelMinimum ||
        effect.masteryLevelMinimum < 1 ||
        effect.masteryLevelMinimum > 100
      ) {
        newErrors[`bonusEffect_${index}`] =
          "Mastery level must be between 1 and 100";
      }
      if (!effect.effectsDescription.trim()) {
        newErrors[`bonusEffect_${index}`] = "Effects description is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Convert folder path back to ID for saving
      const { folderPath, ...restFormData } = formData;
      const folderId = getFolderIdByPath(folderPath, folders);

      await onSave({
        ...restFormData,
        folderId,
        convocation: formData.convocation as SpellConvocation,
      });
      markClean(formData); // Mark form as clean after successful save
    } catch (error) {
      console.error("Failed to save spell:", error);
      handleApiError(error as any, `Failed to ${mode} spell`);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    updateData(newFormData);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Bonus Effects Management
  const handleAddBonusEffect = () => {
    const newBonusEffect: BonusEffect = {
      masteryLevelMinimum: 50,
      effectsDescription: "",
    };
    const newFormData = {
      ...formData,
      bonusEffects: [...formData.bonusEffects, newBonusEffect],
    };
    setFormData(newFormData);
    updateData(newFormData);
  };

  const handleUpdateBonusEffect = (index: number, bonusEffect: BonusEffect) => {
    const newFormData = {
      ...formData,
      bonusEffects: formData.bonusEffects.map((effect, i) =>
        i === index ? bonusEffect : effect,
      ),
    };
    setFormData(newFormData);
    updateData(newFormData);

    // Clear any bonus effect errors
    if (errors[`bonusEffect_${index}`]) {
      setErrors((prev) => ({ ...prev, [`bonusEffect_${index}`]: "" }));
    }
  };

  const handleRemoveBonusEffect = (index: number) => {
    const newFormData = {
      ...formData,
      bonusEffects: formData.bonusEffects.filter((_, i) => i !== index),
    };
    setFormData(newFormData);
    updateData(newFormData);

    // Clear any bonus effect errors for this index
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`bonusEffect_${index}`];
      return newErrors;
    });
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name field (required) */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Spell Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-600"
          }`}
          placeholder="Enter spell name"
          disabled={loading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Convocation field (required) */}
      <div>
        <label
          htmlFor="convocation"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Convocation *
        </label>
        <select
          id="convocation"
          value={formData.convocation}
          onChange={(e) => handleChange("convocation", e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.convocation ? "border-red-500" : "border-gray-600"
          }`}
          disabled={loading}
        >
          <option value="">Select a convocation</option>
          {convocationOptions.map((convocation) => (
            <option key={convocation} value={convocation}>
              {convocation}
            </option>
          ))}
        </select>
        {errors.convocation && (
          <p className="mt-1 text-sm text-red-400">{errors.convocation}</p>
        )}
      </div>

      {/* Complexity Level field (required) */}
      <div>
        <label
          htmlFor="complexityLevel"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Complexity Level *
        </label>
        <input
          type="number"
          id="complexityLevel"
          min="1"
          max="10"
          value={formData.complexityLevel}
          onChange={(e) =>
            handleChange("complexityLevel", parseInt(e.target.value) || 1)
          }
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.complexityLevel ? "border-red-500" : "border-gray-600"
          }`}
          disabled={loading}
        />
        {errors.complexityLevel && (
          <p className="mt-1 text-sm text-red-400">{errors.complexityLevel}</p>
        )}
      </div>

      {/* Description field (required) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description *
        </label>
        <RichTextEditor
          value={formData.description}
          onChange={(value) => handleChange("description", value)}
          placeholder="Enter spell description with rich formatting..."
          disabled={loading}
          error={!!errors.description}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Bonus Effects Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-300">
            Bonus Effects
          </label>
          <button
            type="button"
            onClick={handleAddBonusEffect}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
            title="Add bonus effect"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Effect
          </button>
        </div>

        {formData.bonusEffects.length === 0 ? (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">
              No bonus effects added yet. Click "Add Effect" to add mastery
              level bonuses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.bonusEffects.map((effect, index) => (
              <BonusEffectEditor
                key={index}
                bonusEffect={effect}
                index={index}
                onUpdate={handleUpdateBonusEffect}
                onRemove={handleRemoveBonusEffect}
                disabled={loading}
                error={errors[`bonusEffect_${index}`]}
              />
            ))}
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500">
          Bonus effects are unlocked when a character reaches the specified
          mastery level with this spell.
        </p>
      </div>

      {/* Folder field */}
      <div>
        <FolderPicker
          value={formData.folderPath}
          onChange={(folderPath) => handleChange("folderPath", folderPath)}
          disabled={loading}
          folders={folders}
        />
      </div>

      {/* Casting Time field (optional) */}
      <div>
        <label
          htmlFor="castingTime"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Casting Time
        </label>
        <input
          type="text"
          id="castingTime"
          value={formData.castingTime}
          onChange={(e) => handleChange("castingTime", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., 1 action, 1 minute"
          disabled={loading}
        />
      </div>

      {/* Range field (optional) */}
      <div>
        <label
          htmlFor="range"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Range
        </label>
        <input
          type="text"
          id="range"
          value={formData.range}
          onChange={(e) => handleChange("range", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., Touch, 30 feet"
          disabled={loading}
        />
      </div>

      {/* Duration field (optional) */}
      <div>
        <label
          htmlFor="duration"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Duration
        </label>
        <input
          type="text"
          id="duration"
          value={formData.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., Instantaneous, 1 hour"
          disabled={loading}
        />
      </div>

      {/* Source Book field (optional) */}
      <div>
        <label
          htmlFor="sourceBook"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Source Book
        </label>
        <input
          type="text"
          id="sourceBook"
          value={formData.sourceBook}
          onChange={(e) => handleChange("sourceBook", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., HarnMaster Magic, Shek-Pvar"
          disabled={loading}
        />
      </div>

      {/* Source Page field (optional) */}
      <div>
        <label
          htmlFor="sourcePage"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Source Page
        </label>
        <input
          type="text"
          id="sourcePage"
          value={formData.sourcePage}
          onChange={(e) => handleChange("sourcePage", e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., Neutral 4, Fyvria 12, 42"
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

    {/* Error Modal */}
    {errorInfo && (
      <ErrorModal
        isOpen={showErrorModal}
        onClose={clearError}
        error={errorInfo}
        title={`Error ${mode === 'create' ? 'Creating' : 'Updating'} Spell`}
      />
    )}
  </>
  );
}
