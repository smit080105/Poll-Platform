import express from 'express';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { prisma } from './database.js';
import authRoutes from './routes/auth.js';
import pollRoutes from './routes/polls.js';
import voteRoutes from './routes/votes.js';
import { logger } from './utils/logger.js';

const app = express();

// Required for correct client IPs behind the reverse proxy (affects rate limiting).
app.set('trust proxy', 1);
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

export default app;
