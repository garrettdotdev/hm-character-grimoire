import { prismaService } from '../services/PrismaService.js';
import type { Character, SpellConvocation } from '@repo/types';
import type { ICharacterRepository } from './ICharacterRepository.js';

export class PrismaCharacterRepository implements ICharacterRepository {
  private get prisma() {
    return prismaService.prisma;
  }

  async findAll(): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      include: {
        spells: true
      },
      orderBy: { name: 'asc' }
    });
    return characters.map(this.mapToCharacter);
  }

  async findById(id: string): Promise<Character | null> {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        spells: true
      }
    });
    return character ? this.mapToCharacter(character) : null;
  }

  async findByName(name: string): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        name: {
          contains: name
        }
      },
      orderBy: { name: 'asc' }
    });
    return characters.map(this.mapToCharacter);
  }

  async create(character: Character): Promise<void> {
    await this.prisma.character.create({
      data: {
        id: character.id,
        name: character.name,
        convocations: JSON.stringify(character.convocations),
        rank: character.rank,
        game: character.game,
      }
    });
  }

  async update(character: Character): Promise<void> {
    await this.prisma.character.update({
      where: { id: character.id },
      data: {
        name: character.name,
        convocations: JSON.stringify(character.convocations),
        rank: character.rank,
        game: character.game,
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.character.delete({
      where: { id }
    });
  }



  async getCharacterSpells(characterId: string): Promise<string[]> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        spells: {
          select: { id: true }
        }
      }
    });

    return character?.spells.map(spell => spell.id) || [];
  }

  async getCharacterSpellCount(characterId: string): Promise<number> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        _count: {
          select: { spells: true }
        }
      }
    });

    return character?._count.spells || 0;
  }

  async getCharactersByGame(game: string): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      where: { game },
      orderBy: { name: 'asc' }
    });
    return characters.map(this.mapToCharacter);
  }

  async getCharactersByConvocation(convocation: SpellConvocation): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        convocations: {
          contains: convocation
        }
      },
      orderBy: { name: 'asc' }
    });
    return characters.map(this.mapToCharacter);
  }

  async search(query: string): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            game: {
              contains: query
            }
          },
          {
            rank: {
              contains: query
            }
          }
        ]
      },
      include: {
        spells: true
      },
      orderBy: { name: 'asc' }
    });
    return characters.map(this.mapToCharacter);
  }

  async getCharacterCount(): Promise<number> {
    return await this.prisma.character.count();
  }

  async addSpell(characterId: string, spellId: string): Promise<void> {
    // Check if relationship already exists
    const existing = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        spells: {
          some: { id: spellId }
        }
      }
    });

    if (!existing) {
      await this.prisma.character.update({
        where: { id: characterId },
        data: {
          spells: {
            connect: { id: spellId }
          }
        }
      });
    }
  }

  async removeSpell(characterId: string, spellId: string): Promise<void> {
    await this.prisma.character.update({
      where: { id: characterId },
      data: {
        spells: {
          disconnect: { id: spellId }
        }
      }
    });
  }

  async hasSpell(characterId: string, spellId: string): Promise<boolean> {
    const character = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        spells: {
          some: { id: spellId }
        }
      }
    });
    return !!character;
  }

  private mapToCharacter(character: any): Character {
    return {
      id: character.id,
      name: character.name,
      convocations: JSON.parse(character.convocations) as SpellConvocation[],
      rank: character.rank,
      game: character.game,
      knownSpellIds: character.spells ? character.spells.map((spell: any) => spell.id) : [],
    };
  }
}
