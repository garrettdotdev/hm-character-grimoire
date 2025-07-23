import { z } from 'zod';
import { SpellConvocation, CharacterRank } from '@repo/types';

// Base schemas for enums
export const SpellConvocationSchema = z.nativeEnum(SpellConvocation);
export const CharacterRankSchema = z.nativeEnum(CharacterRank);

// Bonus Effect schema
export const BonusEffectSchema = z.object({
  masteryLevelMinimum: z.number().int().min(1),
  effectsDescription: z.string().min(1),
});

// Spell schemas
export const CreateSpellSchema = z.object({
  name: z.string().min(1).max(255),
  convocation: SpellConvocationSchema,
  complexityLevel: z.number().int().min(1).max(20),
  description: z.string().min(1),
  bonusEffects: z.array(BonusEffectSchema).optional().default([]),
  castingTime: z.string().optional().default(''),
  range: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  folderId: z.number().int().positive().optional().default(1),
  sourceBook: z.string().optional().default(''),
  sourcePage: z.string().optional().default(''),
});

export const UpdateSpellSchema = CreateSpellSchema.partial();

export const SpellSchema = CreateSpellSchema.extend({
  id: z.string().uuid(),
});

// Character schemas
export const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  convocations: z.array(SpellConvocationSchema).min(1),
  rank: CharacterRankSchema,
  game: z.string().optional().default(''),
});

export const UpdateCharacterSchema = CreateCharacterSchema.partial();

export const CharacterSchema = CreateCharacterSchema.extend({
  id: z.string().uuid(),
  knownSpellIds: z.array(z.string().uuid()).default([]),
});

// Folder schemas
export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.number().int().positive().nullable().optional().default(1),
});

export const MoveFolderSchema = z.object({
  folderId: z.number().int().positive(),
  newParentId: z.number().int().positive().nullable(),
});

export const RenameFolderSchema = z.object({
  folderId: z.number().int().positive(),
  newName: z.string().min(1).max(255),
});

export const DeleteFolderSchema = z.object({
  folderId: z.number().int().positive(),
  strategy: z.enum(['empty-only', 'move-to-parent', 'recursive']).optional().default('empty-only'),
});

export const FolderContentsSchema = z.object({
  folderId: z.number().int().positive(),
});

// Folder parameter and body schemas for RESTful routes
export const FolderIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Must be a valid number'),
});

export const RenameFolderBodySchema = z.object({
  newName: z.string().min(1).max(255),
});

export const MoveFolderBodySchema = z.object({
  newParentId: z.number().int().positive().nullable(),
});

export const DeleteFolderBodySchema = z.object({
  strategy: z.enum(['empty-only', 'move-to-parent', 'recursive']).optional().default('empty-only'),
});

// Import schemas
export const SpellImportSchema = z.object({
  spells: z.array(CreateSpellSchema),
});

export const MoveSpellSchema = z.object({
  folderId: z.number().int().positive(),
});

export const AddSpellToCharacterSchema = z.object({
  spellId: z.string().uuid(),
});

// Query parameter schemas
export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(255),
});

export const PaginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)).optional(),
  limit: z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)).optional(),
});

// Parameter schemas
export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const CharacterSpellParamSchema = z.object({
  id: z.string().uuid(),
  spellId: z.string().uuid(),
});

export const FolderPathParamSchema = z.object({
  folderPath: z.string().min(1),
});

// Query parameter schemas
export const SpellFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  convocation: z.union([SpellConvocationSchema, z.literal('all')]).optional(),
  complexityLevel: z.union([z.coerce.number().int().min(1), z.literal('all')]).optional(),
  sortBy: z.enum(['name', 'complexity']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const CharacterFiltersSchema = z.object({
  searchTerm: z.string().optional(),
  convocation: z.union([SpellConvocationSchema, z.literal('all')]).optional(),
  rank: z.union([CharacterRankSchema, z.literal('all')]).optional(),
  sortBy: z.enum(['name', 'rank']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Relationship schemas
export const RemoveSpellFromCharacterSchema = z.object({
  spellId: z.string().uuid(),
});

// Export all schemas as a convenience
export const schemas = {
  // Spell schemas
  CreateSpell: CreateSpellSchema,
  UpdateSpell: UpdateSpellSchema,
  Spell: SpellSchema,
  
  // Character schemas
  CreateCharacter: CreateCharacterSchema,
  UpdateCharacter: UpdateCharacterSchema,
  Character: CharacterSchema,
  
  // Folder schemas
  CreateFolder: CreateFolderSchema,
  DeleteFolder: DeleteFolderSchema,
  MoveFolder: MoveFolderSchema,
  RenameFolder: RenameFolderSchema,
  FolderContents: FolderContentsSchema,

  // RESTful folder schemas
  FolderIdParam: FolderIdParamSchema,
  RenameFolderBody: RenameFolderBodySchema,
  MoveFolderBody: MoveFolderBodySchema,
  DeleteFolderBody: DeleteFolderBodySchema,
  
  // Import schemas
  SpellImport: SpellImportSchema,
  MoveSpell: MoveSpellSchema,
  AddSpellToCharacter: AddSpellToCharacterSchema,

  // Query schemas
  SearchQuery: SearchQuerySchema,
  PaginationQuery: PaginationQuerySchema,

  // Parameter schemas
  UuidParam: UuidParamSchema,
  CharacterSpellParam: CharacterSpellParamSchema,
  FolderPathParam: FolderPathParamSchema,
  
  // Query schemas
  SpellFilters: SpellFiltersSchema,
  CharacterFilters: CharacterFiltersSchema,
  
  // Relationship schemas
  RemoveSpellFromCharacter: RemoveSpellFromCharacterSchema,
  
  // Base schemas
  SpellConvocation: SpellConvocationSchema,
  CharacterRank: CharacterRankSchema,
  BonusEffect: BonusEffectSchema,
} as const;

// Type inference helpers
export type CreateSpellInput = z.infer<typeof CreateSpellSchema>;
export type UpdateSpellInput = z.infer<typeof UpdateSpellSchema>;
export type CreateCharacterInput = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof UpdateCharacterSchema>;
export type SpellFiltersInput = z.infer<typeof SpellFiltersSchema>;
export type CharacterFiltersInput = z.infer<typeof CharacterFiltersSchema>;
