import express from 'express';
import { createServer } from 'http';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import pollRoutes from './routes/polls.js';
import voteRoutes from './routes/votes.js';
import { logger } from './utils/logger.js';

if (!process.env.DATABASE_URL) {
  logger.fatal('Missing required environment variable: DATABASE_URL');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  logger.fatal('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

const app = express();
const prisma = new PrismaClient();

// Required for correct client IPs behind Render's reverse proxy (affects rate limiting)
app.set('trust proxy', 1);
const httpServer = createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use((req, res, next) => {
  const requestId = randomUUID();
  const startedAt = performance.now();
  req.id = requestId;
  req.log = logger.child({ requestId });
  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    req.log.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTimeMs: Math.round(performance.now() - startedAt)
    }, 'HTTP request completed');
  });
  next();
});
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, 'Health check failed');
    res.status(503).json({ status: 'error', database: 'unreachable', timestamp: new Date().toISOString() });
  }
});

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