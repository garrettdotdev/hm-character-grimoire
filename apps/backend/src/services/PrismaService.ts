import { PrismaClient } from '../generated/prisma/index.js';

class PrismaService {
  private static instance: PrismaService;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('Connected to database via Prisma');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  public async ensureRootFolder(): Promise<void> {
    // Ensure the root folder exists
    const rootFolder = await this.prisma.folder.findFirst({
      where: { parentId: null }
    });

    if (!rootFolder) {
      await this.prisma.folder.create({
        data: {
          id: 1,
          name: '',
          parentId: null,
        }
      });
      console.log('Created root folder');
    }
  }
}

export const prismaService = PrismaService.getInstance();
export { PrismaClient } from '../generated/prisma/index.js';
