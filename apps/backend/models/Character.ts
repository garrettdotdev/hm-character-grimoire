import { SpellConvocation } from "./Spell.js";

export enum CharacterRank {
  MAVARI = "Mavari",
  SATIA_MAVARI = "Satia-Mavari",
  SHENEVA = "Sheneva",
  VIRAN = "Viran",
}

export interface Character {
  id: string;
  name: string;
  convocations: SpellConvocation[]; // Array of convocations the character is attuned to
  rank: CharacterRank;
  game: string;
  knownSpellIds: string[]; // References to Spell IDs
}
