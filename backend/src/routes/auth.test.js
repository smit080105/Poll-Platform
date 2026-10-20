import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const findUnique = jest.fn();
const create = jest.fn();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      this.user = { findUnique, create };
    }
  }
}));

const { default: authRoutes } = await import('./auth.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const originalOrganizerSignupCode = process.env.ORGANIZER_SIGNUP_CODE;
const originalJwtSecret = process.env.JWT_SECRET;

describe('authentication request validation', () => {
  beforeEach(() => {
    findUnique.mockClear();
    create.mockClear();
  });

  afterEach(() => {
    if (originalOrganizerSignupCode === undefined) {
      delete process.env.ORGANIZER_SIGNUP_CODE;
    } else {
      process.env.ORGANIZER_SIGNUP_CODE = originalOrganizerSignupCode;
    }

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
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

  it('rejects unsupported registration roles', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'password123',
        name: 'Example User',
        role: 'ADMIN'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/role/i);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('disables organizer registration when no code is configured', async () => {
    delete process.env.ORGANIZER_SIGNUP_CODE;

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'organizer@example.com',
        password: 'password123',
        name: 'Example Organizer',
        role: 'ORGANIZER'
      });

    expect(response.status).toBe(503);
    expect(response.body.error).toMatch(/not enabled/i);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid organizer code before creating a user', async () => {
    process.env.ORGANIZER_SIGNUP_CODE = 'trusted-organizer-code';

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'organizer@example.com',
        password: 'password123',
        name: 'Example Organizer',
        role: 'ORGANIZER',
        organizerCode: 'incorrect-code'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/registration code/i);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('creates an organizer only when the configured code matches', async () => {
    process.env.ORGANIZER_SIGNUP_CODE = 'trusted-organizer-code';
    process.env.JWT_SECRET = 'test-jwt-secret';
    findUnique.mockResolvedValue(null);
    create.mockImplementation(({ data }) => Promise.resolve({
      id: 'organizer-id',
      ...data
    }));

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'organizer@example.com',
        password: 'password123',
        name: 'Example Organizer',
        role: 'ORGANIZER',
        organizerCode: 'trusted-organizer-code'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('ORGANIZER');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role: 'ORGANIZER' })
    }));
  });
});
