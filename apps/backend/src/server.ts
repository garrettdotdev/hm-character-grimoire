import { createApp, closeApp } from './app.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = await createApp();

    const server = app.listen(PORT, () => {
      console.log(`HarnMaster Grimoire API running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await closeApp(app);
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await closeApp(app);
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
