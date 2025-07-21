import { useState, useEffect } from 'react'
import {type BonusEffect, type Spell, SpellConvocation} from '../types'
import { FolderPicker } from './FolderPicker'
import { RichTextEditor } from './RichTextEditor'
import { BonusEffectEditor } from './BonusEffectEditor'

interface SpellFormProps {
  onSave: (spell: {
    name: string;
    convocation: "Lyahvi" | "Peleahn" | "Jmorvi" | "Fyvria" | "Odivshe" | "Savorya" | "Neutral" | string;
    complexityLevel: number;
    description: string;
    bonusEffects: BonusEffect[];
    castingTime: string;
    range: string;
    duration: string;
    folderPath: string;
    sourceBook: string;
    sourcePage: number
  }) => Promise<void>
  onCancel: () => void
  loading?: boolean
  initialData?: Omit<Spell, 'id'>
  mode?: 'create' | 'edit'
  allSpells?: Spell[] // For extracting existing folder paths
}

export function SpellForm({
  onSave,
  onCancel,
  loading = false,
  initialData,
  mode = 'create',
  allSpells = []
}: SpellFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    convocation: initialData?.convocation || '',
    complexityLevel: initialData?.complexityLevel || 1,
    description: initialData?.description || '',
    bonusEffects: initialData?.bonusEffects || [],
    castingTime: initialData?.castingTime || '',
    range: initialData?.range || '',
    duration: initialData?.duration || '',
    folderPath: initialData?.folderPath || '/',
    sourceBook: initialData?.sourceBook || '',
    sourcePage: initialData?.sourcePage || 0
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        convocation: initialData.convocation || '',
        complexityLevel: initialData.complexityLevel || 1,
        description: initialData.description || '',
        bonusEffects: initialData.bonusEffects || [],
        castingTime: initialData.castingTime || '',
        range: initialData.range || '',
        duration: initialData.duration || '',
        folderPath: initialData.folderPath || '/',
        sourceBook: initialData.sourceBook || '',
        sourcePage: initialData.sourcePage || 0
      })
    }
  }, [initialData])

  // Extract existing folder paths from all spells
  const existingFolders = allSpells.map(spell => spell.folderPath).filter(Boolean)

  const convocationOptions = Object.values(SpellConvocation)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const newErrors: { [key: string]: string } = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Spell name is required'
    }
    if (!formData.convocation) {
      newErrors.convocation = 'Convocation is required'
    }
    if (!formData.complexityLevel || formData.complexityLevel < 1) {
      newErrors.complexityLevel = 'Complexity level must be at least 1'
    }
    // Strip Markdown formatting for validation
    const descriptionText = formData.description.replace(/[#*_`~[\]()]/g, '').trim()
    if (!descriptionText) {
      newErrors.description = 'Spell description is required'
    }

    // Validate bonus effects
    formData.bonusEffects.forEach((effect, index) => {
      if (!effect.masteryLevelMinimum || effect.masteryLevelMinimum < 1 || effect.masteryLevelMinimum > 100) {
        newErrors[`bonusEffect_${index}`] = 'Mastery level must be between 1 and 100'
      }
      if (!effect.effectsDescription.trim()) {
        newErrors[`bonusEffect_${index}`] = 'Effects description is required'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Failed to save spell:', error)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Bonus Effects Management
  const handleAddBonusEffect = () => {
    const newBonusEffect: BonusEffect = {
      masteryLevelMinimum: 50,
      effectsDescription: ''
    }
    setFormData(prev => ({
      ...prev,
      bonusEffects: [...prev.bonusEffects, newBonusEffect]
    }))
  }

  const handleUpdateBonusEffect = (index: number, bonusEffect: BonusEffect) => {
    setFormData(prev => ({
      ...prev,
      bonusEffects: prev.bonusEffects.map((effect, i) =>
        i === index ? bonusEffect : effect
      )
    }))
    // Clear any bonus effect errors
    if (errors[`bonusEffect_${index}`]) {
      setErrors(prev => ({ ...prev, [`bonusEffect_${index}`]: '' }))
    }
  }

  const handleRemoveBonusEffect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bonusEffects: prev.bonusEffects.filter((_, i) => i !== index)
    }))
    // Clear any bonus effect errors for this index
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`bonusEffect_${index}`]
      return newErrors
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name field (required) */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Spell Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-600'
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
        <label htmlFor="convocation" className="block text-sm font-medium text-gray-300 mb-1">
          Convocation *
        </label>
        <select
          id="convocation"
          value={formData.convocation}
          onChange={(e) => handleChange('convocation', e.target.value)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.convocation ? 'border-red-500' : 'border-gray-600'
          }`}
          disabled={loading}
        >
          <option value="">Select a convocation</option>
          {convocationOptions.map(convocation => (
            <option key={convocation} value={convocation}>{convocation}</option>
          ))}
        </select>
        {errors.convocation && (
          <p className="mt-1 text-sm text-red-400">{errors.convocation}</p>
        )}
      </div>

      {/* Complexity Level field (required) */}
      <div>
        <label htmlFor="complexityLevel" className="block text-sm font-medium text-gray-300 mb-1">
          Complexity Level *
        </label>
        <input
          type="number"
          id="complexityLevel"
          min="1"
          max="10"
          value={formData.complexityLevel}
          onChange={(e) => handleChange('complexityLevel', parseInt(e.target.value) || 1)}
          className={`w-full px-3 py-2 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${
            errors.complexityLevel ? 'border-red-500' : 'border-gray-600'
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
          onChange={(value) => handleChange('description', value)}
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
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Effect
          </button>
        </div>

        {formData.bonusEffects.length === 0 ? (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">
              No bonus effects added yet. Click "Add Effect" to add mastery level bonuses.
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
          Bonus effects are unlocked when a character reaches the specified mastery level with this spell.
        </p>
      </div>

      {/* Folder Path field */}
      <div>
        <FolderPicker
          value={formData.folderPath}
          onChange={(folderPath) => handleChange('folderPath', folderPath)}
          disabled={loading}
          allFolders={existingFolders}
        />
      </div>

      {/* Casting Time field (optional) */}
      <div>
        <label htmlFor="castingTime" className="block text-sm font-medium text-gray-300 mb-1">
          Casting Time
        </label>
        <input
          type="text"
          id="castingTime"
          value={formData.castingTime}
          onChange={(e) => handleChange('castingTime', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., 1 action, 1 minute"
          disabled={loading}
        />
      </div>

      {/* Range field (optional) */}
      <div>
        <label htmlFor="range" className="block text-sm font-medium text-gray-300 mb-1">
          Range
        </label>
        <input
          type="text"
          id="range"
          value={formData.range}
          onChange={(e) => handleChange('range', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., Touch, 30 feet"
          disabled={loading}
        />
      </div>

      {/* Duration field (optional) */}
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">
          Duration
        </label>
        <input
          type="text"
          id="duration"
          value={formData.duration}
          onChange={(e) => handleChange('duration', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="e.g., Instantaneous, 1 hour"
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
          {loading ? (mode === 'edit' ? 'Updating...' : 'Saving...') : (mode === 'edit' ? 'Update' : 'Save')}
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
  )
}
