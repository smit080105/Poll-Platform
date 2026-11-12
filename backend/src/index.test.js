import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';

const queryRaw = jest.fn();
const requestLogger = {
  info: jest.fn(),
  error: jest.fn()
};
const logger = {
  child: jest.fn(() => requestLogger)
};

jest.unstable_mockModule('./database.js', () => ({
  prisma: { $queryRaw: queryRaw }
}));
jest.unstable_mockModule('./utils/logger.js', () => ({
  logger,
  logError: jest.fn()
}));

const { default: app } = await import('./app.js');

describe('Health check', () => {
  beforeEach(() => {
    queryRaw.mockReset().mockResolvedValue([{ '?column?': 1 }]);
    requestLogger.info.mockClear();
    requestLogger.error.mockClear();
  });

  it('GET /api/health returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('returns 503 when the database health check fails', async () => {
    queryRaw.mockRejectedValueOnce(new Error('Database unavailable'));

    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ status: 'error', database: 'unreachable' });
    expect(requestLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Health check failed'
    );
  });
});
