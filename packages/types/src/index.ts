// Core domain types for the HarnMaster Grimoire application

export enum SpellConvocation {
  LYAHVI = "Lyahvi",
  PELEAHN = "Peleahn",
  JMORVI = "Jmorvi",
  FYVRIA = "Fyvria",
  ODIVSHE = "Odivshe",
  SAVORYA = "Savorya",
  NEUTRAL = "Neutral",
}

export enum CharacterRank {
  MAVARI = "Mavari",
  SATIA_MAVARI = "Satia-Mavari",
  SHENEVA = "Sheneva",
  VIRAN = "Viran",
}

export interface BonusEffect {
  masteryLevelMinimum: number;
  effectsDescription: string;
}

export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
}

export interface FolderWithPath extends Folder {
  path: string;
  children?: FolderWithPath[];
}

export interface Spell {
  id: string;
  name: string;
  convocation: SpellConvocation;
  complexityLevel: number;
  description: string;
  bonusEffects: BonusEffect[];
  castingTime: string;
  range: string;
  duration: string;
  folderId: number;
  sourceBook: string;
  sourcePage: string;
}

export interface Character {
  id: string;
  name: string;
  convocations: SpellConvocation[];
  rank: CharacterRank;
  game: string;
  knownSpellIds: string[];
}

// API Request/Response types
export interface CreateSpellRequest {
  name: string;
  convocation: SpellConvocation;
  complexityLevel: number;
  description: string;
  bonusEffects?: BonusEffect[];
  castingTime?: string;
  range?: string;
  duration?: string;
  folderId?: number;
  sourceBook?: string;
  sourcePage?: string;
}

export interface UpdateSpellRequest extends Partial<CreateSpellRequest> {}

export interface CreateCharacterRequest {
  name: string;
  convocations: SpellConvocation[];
  rank: CharacterRank;
  game?: string;
}

export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> {}

export interface SpellImportRequest {
  spells: CreateSpellRequest[];
}

export interface CreateFolderRequest {
  name: string;
  parentId: number | null;
}

export interface MoveFolderRequest {
  folderId: number;
  newParentId: number | null;
}

export interface RenameFolderRequest {
  folderId: number;
  newName: string;
}

export interface FolderContents {
  spellCount: number;
  subfolderCount: number;
  subfolders: FolderWithPath[];
  totalSpellsRecursive: number;
  totalSubfoldersRecursive: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SpellsResponse {
  spells: Spell[];
}

export interface CharactersResponse {
  characters: Character[];
}

export interface FoldersResponse {
  folders: FolderWithPath[];
}

export interface ImportError {
  spell: any;
  error: string;
}

export interface ImportResponse {
  message: string;
  importedCount: number;
  totalAttempted: number;
  errorCount?: number;
  errors?: ImportError[];
}

// Utility types
export type CreateSpell = Omit<Spell, 'id'>;
export type CreateCharacter = Omit<Character, 'id' | 'knownSpellIds'>;
export type SpellWithoutId = Omit<Spell, 'id'>;
export type CharacterWithoutId = Omit<Character, 'id'>;

// Filter and sort types
export interface SpellFilters {
  searchTerm?: string;
  convocation?: SpellConvocation | 'all';
  complexityLevel?: number | 'all';
  sortBy?: 'name' | 'complexity';
  sortOrder?: 'asc' | 'desc';
}

export interface CharacterFilters {
  searchTerm?: string;
  convocation?: SpellConvocation | 'all';
  rank?: CharacterRank | 'all';
  sortBy?: 'name' | 'rank';
  sortOrder?: 'asc' | 'desc';
}
