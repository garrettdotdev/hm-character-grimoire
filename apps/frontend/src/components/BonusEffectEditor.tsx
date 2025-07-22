import { useState } from "react";
import type { BonusEffect } from "../types";

interface BonusEffectEditorProps {
  bonusEffect: BonusEffect;
  index: number;
  onUpdate: (index: number, bonusEffect: BonusEffect) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  error?: string;
}

export function BonusEffectEditor({
  bonusEffect,
  index,
  onUpdate,
  onRemove,
  disabled = false,
  error,
}: BonusEffectEditorProps) {
  const [localEffect, setLocalEffect] = useState(bonusEffect);

  const handleChange = (field: keyof BonusEffect, value: string | number) => {
    const updatedEffect = { ...localEffect, [field]: value };
    setLocalEffect(updatedEffect);
    onUpdate(index, updatedEffect);
  };

  return (
    <div
      className={`bg-gray-800 border rounded-lg p-4 space-y-3 ${error ? "border-red-500" : "border-gray-600"}`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">
          Bonus Effect #{index + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          title="Remove bonus effect"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Mastery Level Minimum */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Mastery Level Minimum *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={localEffect.masteryLevelMinimum}
            onChange={(e) =>
              handleChange("masteryLevelMinimum", parseInt(e.target.value) || 1)
            }
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            placeholder="e.g., 60"
            disabled={disabled}
          />
        </div>

        {/* Effects Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Effects Description *
          </label>
          <textarea
            rows={2}
            value={localEffect.effectsDescription}
            onChange={(e) => handleChange("effectsDescription", e.target.value)}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Describe the bonus effect..."
            disabled={disabled}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
