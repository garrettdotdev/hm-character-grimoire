// 1. SpellDetailsModal.tsx
import { type Spell } from '../types'

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
        <div className="mb-4">{spell.description}</div>
        <div className="mb-2 text-gray-400">Time: {spell.castingTime}</div>
        <div className="mb-2 text-gray-400">Range: {spell.range}</div>
        <div className="mb-2 text-gray-400">Duration: {spell.duration}</div>
      </div>
    </div>
  )
}