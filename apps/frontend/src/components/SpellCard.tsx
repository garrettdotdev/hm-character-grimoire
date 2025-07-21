import type { Spell } from '../types'
import { MarkdownRenderer } from './MarkdownRenderer'

interface SpellCardProps {
  spell: Spell
  size?: 'small' | 'medium' | 'large'
  onRemove?: () => void
  onClick?: () => void
}

export function SpellCard({ spell, size = 'medium', onRemove, onClick }: SpellCardProps) {
  const sizeClasses = {
    small: 'w-48 h-32',
    medium: 'w-64 h-40',
    large: 'w-80 h-48'
  }

  const textSizeClasses = {
    small: {
      title: 'text-sm',
      subtitle: 'text-xs',
      description: 'text-xs',
      details: 'text-xs'
    },
    medium: {
      title: 'text-base',
      subtitle: 'text-sm',
      description: 'text-sm',
      details: 'text-xs'
    },
    large: {
      title: 'text-lg',
      subtitle: 'text-base',
      description: 'text-sm',
      details: 'text-sm'
    }
  }

  const textClasses = textSizeClasses[size]

  return (
    <div className={`${sizeClasses[size]} bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors relative group flex flex-col`} onClick={onClick}>
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          title="Remove spell from character"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div className="mb-2">
        <h3 className={`${textClasses.title} font-semibold text-white truncate pr-8`}>
          {spell.name}
        </h3>
        <div className={`${textClasses.subtitle} text-gray-400`}>
          {spell.convocation} • Level {spell.complexityLevel}
        </div>
      </div>

      {/* Description */}
      <div className="flex-1 overflow-hidden mb-2">
        <MarkdownRenderer
          content={spell.description}
          className={`${textClasses.description} text-gray-300`}
          truncate={true}
          maxLines={3}
        />
      </div>

      {/* Footer details */}
      <div className={`${textClasses.details} text-gray-500 space-y-1`}>
        {spell.castingTime && (
          <div className="truncate">
            <span className="font-medium">Cast:</span> {spell.castingTime}
          </div>
        )}
        {spell.range && (
          <div className="truncate">
            <span className="font-medium">Range:</span> {spell.range}
          </div>
        )}
        {spell.duration && (
          <div className="truncate">
            <span className="font-medium">Duration:</span> {spell.duration}
          </div>
        )}
      </div>
    </div>
  )
}