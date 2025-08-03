import { apiClient, ApiError } from '@repo/api-client';

// Re-export the API client and types for convenience
export { ApiError } from '@repo/api-client';
export type * from '@repo/types';

// Create a wrapper that adds error handling
class ApiWrapper {
  private client = apiClient;
  private errorHandler?: (error: ApiError) => void;

  setErrorHandler(handler: (error: ApiError) => void) {
    this.errorHandler = handler;
  }

  private async handleRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (error instanceof ApiError && this.errorHandler) {
        this.errorHandler(error);
      }
      throw error;
    }
  }

  // Proxy all methods to the underlying client with error handling
  async health() {
    return this.handleRequest(() => this.client.health());
  }

  async getSpells() {
    return this.handleRequest(() => this.client.getSpells());
  }

  async getSpell(id: string) {
    return this.handleRequest(() => this.client.getSpell(id));
  }

  async createSpell(spell: any) {
    return this.handleRequest(() => this.client.createSpell(spell));
  }

  async updateSpell(id: string, spell: any) {
    return this.handleRequest(() => this.client.updateSpell(id, spell));
  }

  async deleteSpell(id: string) {
    return this.handleRequest(() => this.client.deleteSpell(id));
  }

  async importSpells(data: any) {
    return this.handleRequest(() => this.client.importSpells(data));
  }

  async searchSpells(query: string) {
    return this.handleRequest(() => this.client.searchSpells(query));
  }

  async getSpellsByFolder(folderId: number) {
    return this.handleRequest(() => this.client.getSpellsByFolder(folderId));
  }

  async moveSpell(spellId: string, folderId: number) {
    return this.handleRequest(() => this.client.moveSpell(spellId, folderId));
  }

  async getCharacters() {
    return this.handleRequest(() => this.client.getCharacters());
  }

  async getCharacter(id: string) {
    return this.handleRequest(() => this.client.getCharacter(id));
  }

  async createCharacter(character: any) {
    return this.handleRequest(() => this.client.createCharacter(character));
  }

  async updateCharacter(id: string, character: any) {
    return this.handleRequest(() => this.client.updateCharacter(id, character));
  }

  async deleteCharacter(id: string) {
    return this.handleRequest(() => this.client.deleteCharacter(id));
  }

  async getCharacterSpells(id: string) {
    return this.handleRequest(() => this.client.getCharacterSpells(id));
  }

  async addSpellToCharacter(characterId: string, spellId: string) {
    return this.handleRequest(() => this.client.addSpellToCharacter(characterId, spellId));
  }

  async removeSpellFromCharacter(characterId: string, spellId: string) {
    return this.handleRequest(() => this.client.removeSpellFromCharacter(characterId, spellId));
  }

  async getFolders() {
    return this.handleRequest(() => this.client.getFolders());
  }

  async createFolder(folder: any) {
    return this.handleRequest(() => this.client.createFolder(folder));
  }

  async renameFolder(folderId: number, newName: string) {
    return this.handleRequest(() => this.client.renameFolder(folderId, newName));
  }

  async moveFolder(folderId: number, newParentId: number | null) {
    return this.handleRequest(() => this.client.moveFolder(folderId, newParentId));
  }

  async getFolderContents(folderId: number) {
    return this.handleRequest(() => this.client.getFolderContents(folderId));
  }

  async deleteFolder(folderId: number, strategy?: 'empty-only' | 'move-to-parent' | 'recursive') {
    return this.handleRequest(() => this.client.deleteFolder(folderId, strategy));
  }
}

export const api = new ApiWrapper();
