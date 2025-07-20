export const SpellConvocation = {
  LYAHVI: 'Lyahvi',
  PELEAHN: 'Peleahn',
  JMORVI: 'Jmorvi',
  FYVRIA: 'Fyvria',
  ODIVSHE: 'Odivshe',
  SAVORYA: 'Savorya',
  NEUTRAL: 'Neutral'
} as const

export type SpellConvocation = typeof SpellConvocation[keyof typeof SpellConvocation]

export const CharacterRank = {
  MAVARI: 'Mavari',
  SATIA_MAVARI: 'Satia-Mavari',
  SHENEVA: 'Sheneva',
  VIRAN: 'Viran'
} as const

export type CharacterRank = typeof CharacterRank[keyof typeof CharacterRank]

export interface Character {
  id: string
  name: string
  convocations: SpellConvocation[]
  rank: CharacterRank
  game: string
}

export interface BonusEffect {
  masteryLevelMinimum: number
  effectsDescription: string
}

export interface Spell {
  id: string
  name: string
  convocation: SpellConvocation
  complexityLevel: number
  description: string
  bonusEffects: BonusEffect[]
  castingTime: string
  range: string
  duration: string
  folderPath: string
  sourceBook: string
  sourcePage: number
}


