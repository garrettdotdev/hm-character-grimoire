// 1. SpellDetailsModal.tsx
import { type Spell } from "@repo/types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Modal } from "./Modal";

interface SpellDetailsModalProps {
  spell: Spell;
  onClose: () => void;
  isOpen: boolean;
}

export function SpellDetailsModal({
  spell,
  onClose,
  isOpen,
}: SpellDetailsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={spell.name} size="lg">
      <div className="space-y-4">
        <div className="text-gray-400">Convocation: {spell.convocation}</div>
        <div className="text-gray-400">Complexity: {spell.complexityLevel}</div>
        <div className="mb-4">
          <MarkdownRenderer
            content={spell.description}
            className="text-gray-300"
          />
        </div>

        {/* Bonus Effects */}
        {spell.bonusEffects && spell.bonusEffects.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Bonus Effects
            </h3>
            <div className="space-y-2">
              {spell.bonusEffects
                .sort((a, b) => a.masteryLevelMinimum - b.masteryLevelMinimum)
                .map((effect, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <span className="text-blue-400 font-mono font-medium min-w-[60px]">
                      ML{effect.masteryLevelMinimum}+
                    </span>
                    <span className="text-gray-300 flex-1">
                      {effect.effectsDescription}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="text-gray-400">Time: {spell.castingTime}</div>
        <div className="text-gray-400">Range: {spell.range}</div>
        <div className="text-gray-400">Duration: {spell.duration}</div>

        {/* Source Information */}
        {(spell.sourceBook || spell.sourcePage) && (
          <div className="text-gray-400">
            Source: {spell.sourceBook}
            {spell.sourceBook && spell.sourcePage && `, p. ${spell.sourcePage}`}
            {!spell.sourceBook && spell.sourcePage && `Page ${spell.sourcePage}`}
          </div>
        )}
      </div>
    </Modal>
  );
}
