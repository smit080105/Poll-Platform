import { createServer } from 'http';
import { prisma } from './database.js';
import { logger } from './utils/logger.js';
import { validateJwtConfiguration } from './utils/jwt.js';
import app from './app.js';

if (!process.env.DATABASE_URL) {
  logger.fatal('Missing required environment variable: DATABASE_URL');
  process.exit(1);
}
try {
  validateJwtConfiguration();
} catch (error) {
  logger.fatal({ err: error }, 'Invalid JWT signing-key configuration');
  process.exit(1);
}

const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'PollWave server started');
});

let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, 'Shutting down gracefully');
  const forceShutdown = setTimeout(() => {
    logger.fatal('Graceful shutdown timed out; forcing exit');
    process.exit(1);
  }, 10_000);
  forceShutdown.unref();

  httpServer.close(async (error) => {
    clearTimeout(forceShutdown);

    if (error) {
      logger.error({ err: error }, 'Failed to close HTTP server during shutdown');
      process.exit(1);
      return;
    }

    try {
      await prisma.$disconnect();
    } catch (error) {
      logger.error({ err: error }, 'Failed to disconnect Prisma during shutdown');
      process.exit(1);
    }
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));