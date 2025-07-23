import { prismaService } from './PrismaService.js';

type TransactionClient = Parameters<Parameters<typeof prismaService.prisma.$transaction>[0]>[0];

export class TransactionService {
  /**
   * Execute multiple operations within a single database transaction
   * @param operations Function that takes a Prisma transaction client
   * @returns Promise that resolves when all operations complete successfully
   */
  async executeTransaction<T>(
    operations: (tx: TransactionClient) => Promise<T>
  ): Promise<T> {
    return await prismaService.prisma.$transaction(operations);
  }

  /**
   * Execute multiple operations within a single database transaction with timeout
   * @param operations Function that takes a Prisma transaction client
   * @param timeoutMs Timeout in milliseconds (default: 5000ms)
   * @returns Promise that resolves when all operations complete successfully
   */
  async executeTransactionWithTimeout<T>(
    operations: (tx: TransactionClient) => Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T> {
    return await prismaService.prisma.$transaction(operations, {
      timeout: timeoutMs,
    });
  }
}
