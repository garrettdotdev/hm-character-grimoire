import express from 'express';
import cors from 'cors';
import { Container } from './container/Container.js';
import { prismaService } from './services/PrismaService.js';
import { createSpellRoutes } from './routes/spellRoutes.js';
import { createCharacterRoutes } from './routes/characterRoutes.js';
import { createFolderRoutes } from './routes/folderRoutes.js';
import { errorHandler, notFoundHandler, errorLogger } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logging.js';
import { securityHeaders, rateLimiter } from './middleware/security.js';

export async function createApp(): Promise<express.Application> {
  const app = express();

  // Initialize Prisma
  await prismaService.connect();
  await prismaService.ensureRootFolder();

  const container = new Container();

  // Security middleware
  app.use(securityHeaders());

  // Rate limiting (disabled in development)
  if (process.env.NODE_ENV === 'production') {
    app.use(rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 }));
  }

  // CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com'] // Replace with actual domain
      : ['http://localhost:8000', 'http://localhost:3000'],
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger({
    includeQuery: true,
    includeBody: process.env.NODE_ENV === 'development',
    excludePaths: ['/api/health'],
  }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      message: 'HarnMaster Grimoire API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/spells', createSpellRoutes(container.getSpellController()));
  app.use('/api/characters', createCharacterRoutes(container.getCharacterController()));
  app.use('/api/folders', createFolderRoutes(container.getFolderController()));

  // Error handling middleware (order matters!)
  app.use(notFoundHandler);
  app.use(errorLogger());
  app.use(errorHandler);

  // Store container reference for cleanup
  (app as any).container = container;

  return app;
}

export async function closeApp(app: express.Application): Promise<void> {
  await prismaService.disconnect();
}
