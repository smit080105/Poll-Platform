import request from 'supertest';
import { describe, it, expect } from '@jest/globals';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

describe('Health check', () => {
  it('GET /api/health returns 200 with status ok', async () => {
    const res = await request(BASE_URL).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});