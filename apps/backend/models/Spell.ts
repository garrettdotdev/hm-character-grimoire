export enum SpellConvocation {
    LYAHVI = 'Lyahvi',
    PELEAHN = 'Peleahn',
    JMORVI = 'Jmorvi',
    FYVRIA = 'Fyvria',
    ODIVSHE = 'Odivshe',
    SAVORYA = 'Savorya',
    NEUTRAL = 'Neutral'
}

export interface BonusEffect {
    masteryLevelMinimum: number; // 1-100
    effectsDescription: string;
}

export interface Spell {
    id: string;
    name: string;
    convocation: SpellConvocation;
    complexityLevel: number; // minimum 1
    description: string;
    bonusEffects: BonusEffect[];
    castingTime: string;
    range: string;
    duration: string;
}