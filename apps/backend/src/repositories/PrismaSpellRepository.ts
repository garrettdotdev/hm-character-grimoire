import { prismaService } from '../services/PrismaService.js';
import type { Spell, BonusEffect, SpellConvocation } from '@repo/types';
import type { ISpellRepository } from './ISpellRepository.js';

export class PrismaSpellRepository implements ISpellRepository {
  private get prisma() {
    return prismaService.prisma;
  }

  async findAll(): Promise<Spell[]> {
    const spells = await this.prisma.spell.findMany({
      orderBy: { name: 'asc' }
    });
    return spells.map(this.mapToSpell);
  }

  async findById(id: string): Promise<Spell | null> {
    const spell = await this.prisma.spell.findUnique({
      where: { id }
    });
    return spell ? this.mapToSpell(spell) : null;
  }

  async findByIds(ids: string[]): Promise<Spell[]> {
    if (ids.length === 0) return [];

    const spells = await this.prisma.spell.findMany({
      where: {
        id: {
          in: ids
        }
      },
      orderBy: { name: 'asc' }
    });
    return spells.map(this.mapToSpell);
  }

  async findByName(name: string): Promise<Spell[]> {
    const spells = await this.prisma.spell.findMany({
      where: {
        name: {
          contains: name
        }
      },
      orderBy: { name: 'asc' }
    });
    return spells.map(this.mapToSpell);
  }

  async findByExactName(name: string): Promise<Spell | null> {
    const spell = await this.prisma.spell.findFirst({
      where: {
        name: {
          equals: name
        }
      }
    });
    return spell ? this.mapToSpell(spell) : null;
  }

  async findByConvocation(convocation: SpellConvocation): Promise<Spell[]> {
    const spells = await this.prisma.spell.findMany({
      where: { convocation },
      orderBy: { name: 'asc' }
    });
    return spells.map(this.mapToSpell);
  }

  async findByFolderId(folderId: number): Promise<Spell[]> {
    const spells = await this.prisma.spell.findMany({
      where: { folderId },
      orderBy: { name: 'asc' }
    });
    return spells.map(this.mapToSpell);
  }

  async create(spell: Spell): Promise<void> {
    await this.prisma.spell.create({
      data: {
        id: spell.id,
        name: spell.name,
        convocation: spell.convocation,
        complexityLevel: spell.complexityLevel,
        description: spell.description,
        bonusEffects: JSON.stringify(spell.bonusEffects),
        castingTime: spell.castingTime,
        range: spell.range,
        duration: spell.duration,
        folderId: spell.folderId || 1, // Default to root folder
        sourceBook: spell.sourceBook || '',
        sourcePage: spell.sourcePage || '',
      }
    });
  }

  async update(spell: Spell): Promise<void> {
    await this.prisma.spell.update({
      where: { id: spell.id },
      data: {
        name: spell.name,
        convocation: spell.convocation,
        complexityLevel: spell.complexityLevel,
        description: spell.description,
        bonusEffects: JSON.stringify(spell.bonusEffects),
        castingTime: spell.castingTime,
        range: spell.range,
        duration: spell.duration,
        folderId: spell.folderId || 1, // Default to root folder
        sourceBook: spell.sourceBook || '',
        sourcePage: spell.sourcePage || '',
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.spell.delete({
      where: { id }
    });
  }

  async updateFolderId(spellId: string, folderId: number): Promise<void> {
    await this.prisma.spell.update({
      where: { id: spellId },
      data: { folderId }
    });
  }

  async moveSpellsToFolder(fromFolderId: number, toFolderId: number): Promise<void> {
    await this.prisma.spell.updateMany({
      where: { folderId: fromFolderId },
      data: { folderId: toFolderId }
    });
  }

  async createMany(spells: Spell[]): Promise<void> {
    for (const spell of spells) {
      try {
        await this.create(spell);
      } catch (error) {
        // Skip duplicates silently
        if ((error as any)?.code !== 'P2002') {
          throw error;
        }
      }
    }
  }

  async search(query: string): Promise<Spell[]> {
    const spells = await this.prisma.spell.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            description: {
              contains: query
            }
          },
          {
            convocation: {
              contains: query
            }
          },
          {
            bonusEffects: {
              contains: query
            }
          },
          {
            castingTime: {
              contains: query
            }
          },
          {
            range: {
              contains: query
            }
          },
          {
            duration: {
              contains: query
            }
          },
          {
            sourceBook: {
              contains: query
            }
          },
          {
            sourcePage: {
              contains: query
            }
          }
        ]
      },
      orderBy: { name: 'asc' }
    });
    return spells.map(this.mapToSpell);
  }

  async getSpellsByComplexity(minLevel: number, maxLevel: number): Promise<Spell[]> {
    const spells = await this.prisma.spell.findMany({
      where: {
        complexityLevel: {
          gte: minLevel,
          lte: maxLevel
        }
      },
      orderBy: [
        { complexityLevel: 'asc' },
        { name: 'asc' }
      ]
    });
    return spells.map(this.mapToSpell);
  }

  async getSpellCount(): Promise<number> {
    return await this.prisma.spell.count();
  }

  async getSpellCountByFolder(folderId: number): Promise<number> {
    return await this.prisma.spell.count({
      where: { folderId }
    });
  }

  async getSpellCountByConvocation(convocation: SpellConvocation): Promise<number> {
    return await this.prisma.spell.count({
      where: { convocation }
    });
  }

  private mapToSpell(spell: any): Spell {
    return {
      id: spell.id,
      name: spell.name,
      convocation: spell.convocation as SpellConvocation,
      complexityLevel: spell.complexityLevel,
      description: spell.description,
      bonusEffects: JSON.parse(spell.bonusEffects) as BonusEffect[],
      castingTime: spell.castingTime,
      range: spell.range,
      duration: spell.duration,
      folderId: spell.folderId,
      sourceBook: spell.sourceBook || '',
      sourcePage: spell.sourcePage || '',
    };
  }
}
