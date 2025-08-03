import type {
  Spell,
  Character,
  CreateSpellRequest,
  UpdateSpellRequest,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  SpellImportRequest,
  CreateFolderRequest,
  MoveFolderRequest,
  RenameFolderRequest,
  SpellsResponse,
  CharactersResponse,
  FoldersResponse,
  ImportResponse,
  ApiResponse, FolderWithPath, FolderContents,
} from '@repo/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData;
        
        try {
          errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse the error response, use the default message
        }
        
        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0
      );
    }
  }

  // Health check
  async health(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/health');
  }

  // Spell methods
  async getSpells(): Promise<Spell[]> {
    const response = await this.request<SpellsResponse>('/spells');
    return response.spells;
  }

  async getSpell(id: string): Promise<Spell> {
    return this.request<Spell>(`/spells/${id}`);
  }

  async createSpell(spell: CreateSpellRequest): Promise<Spell> {
    return this.request<Spell>('/spells', {
      method: 'POST',
      body: JSON.stringify(spell),
    });
  }

  async updateSpell(id: string, spell: UpdateSpellRequest): Promise<Spell> {
    return this.request<Spell>(`/spells/${id}`, {
      method: 'PUT',
      body: JSON.stringify(spell),
    });
  }

  async deleteSpell(id: string): Promise<void> {
    await this.request<void>(`/spells/${id}`, {
      method: 'DELETE',
    });
  }

  async importSpells(data: SpellImportRequest): Promise<ImportResponse> {
    return this.request<ImportResponse>('/spells/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async moveSpell(spellId: string, folderId: number): Promise<Spell> {
    return this.request<Spell>(`/spells/${spellId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ folderId }),
    });
  }

  // Character methods
  async getCharacters(): Promise<Character[]> {
    const response = await this.request<CharactersResponse>('/characters');
    return response.characters;
  }

  async getCharacter(id: string): Promise<Character> {
    return this.request<Character>(`/characters/${id}`);
  }

  async createCharacter(character: CreateCharacterRequest): Promise<Character> {
    return this.request<Character>('/characters', {
      method: 'POST',
      body: JSON.stringify(character),
    });
  }

  async updateCharacter(id: string, character: UpdateCharacterRequest): Promise<Character> {
    return this.request<Character>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(character),
    });
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.request<void>(`/characters/${id}`, {
      method: 'DELETE',
    });
  }

  async getCharacterSpells(characterId: string): Promise<Spell[]> {
    const response = await this.request<SpellsResponse>(`/characters/${characterId}/spells`);
    return response.spells;
  }

  async addSpellToCharacter(characterId: string, spellId: string): Promise<void> {
    await this.request<void>(`/characters/${characterId}/spells`, {
      method: 'POST',
      body: JSON.stringify({ spellId }),
    });
  }

  async removeSpellFromCharacter(characterId: string, spellId: string): Promise<void> {
    await this.request<void>(`/characters/${characterId}/spells/${spellId}`, {
      method: 'DELETE',
    });
  }

  // Folder methods
  async getFolders(): Promise<FolderWithPath[]> {
    const response = await this.request<FoldersResponse>('/folders');
    return response.folders;
  }

  async createFolder(data: CreateFolderRequest): Promise<{ folderId: number }> {
    return await this.request('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async renameFolder(folderId: number, newName: string): Promise<void> {
    await this.request<void>(`/folders/${folderId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ newName }),
    });
  }

  async moveFolder(folderId: number, newParentId: number | null): Promise<void> {
    await this.request<void>(`/folders/${folderId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ newParentId }),
    });
  }

  async getFolderContents(folderId: number): Promise<FolderContents> {
    return await this.request(`/folders/${folderId}/contents`);
  }

  async deleteFolder(folderId: number, strategy?: 'empty-only' | 'move-to-parent' | 'recursive'): Promise<void> {
    await this.request<void>(`/folders/${folderId}`, {
      method: 'DELETE',
      body: JSON.stringify({ strategy }),
    });
  }

  async searchSpells(query: string): Promise<Spell[]> {
    const response = await this.request<{ spells: Spell[] }>(`/spells/search?q=${encodeURIComponent(query)}`);
    return response.spells;
  }

  async getSpellsByFolder(folderId: number): Promise<Spell[]> {
    const response = await this.request<{ spells: Spell[] }>(`/spells/folder/${folderId}`);
    return response.spells;
  }
}

// Create a default instance
export const apiClient = new ApiClient();

// Export types for convenience
export * from '@repo/types';
