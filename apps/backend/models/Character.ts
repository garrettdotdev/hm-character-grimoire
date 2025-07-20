export interface Character {
    id: string;
    name: string;
    occupation: string;
    game: string;
    knownSpellIds: string[]; // References to Spell IDs
}