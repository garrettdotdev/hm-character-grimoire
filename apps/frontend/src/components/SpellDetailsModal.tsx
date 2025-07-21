// 1. SpellDetailsModal.tsx
import { type Spell } from '../types'
import { MarkdownRenderer } from './MarkdownRenderer'

interface SpellDetailsModalProps {
  spell: Spell
  onClose: () => void
}

export function SpellDetailsModal({ spell, onClose }: SpellDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full relative">
        <button
          className="absolute top-4 right-4 text-white text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">{spell.name}</h2>
        <div className="mb-2 text-gray-400">Convocation: {spell.convocation}</div>
        <div className="mb-2 text-gray-400">Complexity: {spell.complexityLevel}</div>
        <div className="mb-4">
          <MarkdownRenderer
            content={spell.description}
            className="text-gray-300"
          />
        </div>

        {/* Bonus Effects */}
        {spell.bonusEffects && spell.bonusEffects.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Bonus Effects</h3>
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

        <div className="mb-2 text-gray-400">Time: {spell.castingTime}</div>
        <div className="mb-2 text-gray-400">Range: {spell.range}</div>
        <div className="mb-2 text-gray-400">Duration: {spell.duration}</div>
      </div>
    </div>
  )
}