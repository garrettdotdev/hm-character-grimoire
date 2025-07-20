import type { Spell } from '../types'

interface SpellCardProps {
  spell: Spell
}

export function SpellCard({ spell }: SpellCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-fit transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
      <div className="mb-3">
        <h3 className="text-lg font-medium text-white mb-2">{spell.name}</h3>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {spell.convocation}
          </span>
          <span className="bg-gray-700 text-gray-300 border border-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            Level {spell.complexityLevel}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="text-gray-300 leading-relaxed line-clamp-3">
          {spell.description}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-400">
            <span className="text-white font-medium">Casting Time:</span> {spell.castingTime}
          </div>
          <div className="text-sm text-gray-400">
            <span className="text-white font-medium">Range:</span> {spell.range}
          </div>
          <div className="text-sm text-gray-400">
            <span className="text-white font-medium">Duration:</span> {spell.duration}
          </div>
        </div>
      </div>
    </div>
  )
}