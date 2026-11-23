import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const findUnique = jest.fn();
const create = jest.fn();
const update = jest.fn();

jest.unstable_mockModule('../database.js', () => ({
  prisma: { user: { findUnique, create, update } }
}));

const { default: authRoutes, loginLimiter, registrationLimiter } = await import('./auth.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const originalOrganizerSignupCode = process.env.ORGANIZER_SIGNUP_CODE;
const originalJwtSecret = process.env.JWT_SECRET;

describe('authentication request validation', () => {
  beforeEach(() => {
    findUnique.mockClear();
    create.mockClear();
    update.mockClear();
    loginLimiter.resetKey('127.0.0.1');
    registrationLimiter.resetKey('127.0.0.1');
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

  it.each([
    ['too short', 'short-pass'],
    ['over 72 UTF-8 bytes', '😀'.repeat(19)]
  ])('rejects registration passwords that are %s', async (_description, password) => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password, name: 'Example User' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/password/i);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects unsupported registration roles', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery',
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
        password: 'correct-horse-battery',
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
        password: 'correct-horse-battery',
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
        password: 'correct-horse-battery',
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

  it('rejects login while the account is temporarily locked', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    findUnique.mockResolvedValue({
      id: 'participant-id',
      email: 'user@example.com',
      password: 'unused',
      name: 'Example User',
      role: 'PARTICIPANT',
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 5 * 60 * 1000)
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'incorrect-password' });

    expect(response.status).toBe(423);
    expect(response.body.error).toMatch(/locked/i);
  });

  it('rate-limits repeated registration attempts', async () => {
    let response;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await request(app)
        .post('/api/auth/register')
        .send({});
    }

    expect(response.status).toBe(429);
    expect(response.body.error).toMatch(/registration/i);
  });
});
