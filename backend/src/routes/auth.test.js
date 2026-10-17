import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const findUnique = jest.fn();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      this.user = { findUnique };
    }
  }
}));

const { default: authRoutes } = await import('./auth.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('authentication request validation', () => {
  beforeEach(() => {
    findUnique.mockClear();
  });

  it.each([
    ['/register', { email: 42, password: 'password123', name: 'Example User' }],
    ['/register', { email: 'user@example.com', password: {}, name: 'Example User' }],
    ['/register', { email: 'user@example.com', password: 'password123', name: null }],
    ['/login', { email: {}, password: 'password123' }],
    ['/login', { email: 'user@example.com', password: 123 }]
  ])('rejects malformed payloads at %s', async (path, body) => {
    const response = await request(app).post(`/api/auth${path}`).send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/required/i);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
