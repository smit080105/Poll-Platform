import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const findUnique = jest.fn();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      this.poll = { findUnique };
    }
  }
}));

const { default: pollRoutes } = await import('./polls.js');

const app = express();
app.use(express.json());
app.use('/api/polls', pollRoutes);

const secret = 'poll-access-test-secret';
const participantToken = jwt.sign({ id: 'participant-1', role: 'PARTICIPANT' }, secret);
const organizerToken = jwt.sign({ id: 'organizer-1', role: 'ORGANIZER' }, secret);

const makePoll = (overrides = {}) => ({
  id: 'poll-1',
  shortId: 'short-1',
  title: 'Community poll',
  description: '',
  status: 'ACTIVE',
  isPublic: true,
  organizerId: 'organizer-1',
  options: [],
  organizer: { name: 'Organizer' },
  _count: { votes: 0 },
  ...overrides
});

describe('shareable poll access', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    findUnique.mockReset();
  });

  it('allows anonymous access to a published public poll', async () => {
    findUnique.mockResolvedValue(makePoll());

    const response = await request(app).get('/api/polls/s/short-1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('poll-1');
  });

  it('requires sign-in for a published private poll', async () => {
    findUnique.mockResolvedValue(makePoll({ isPublic: false }));

    const response = await request(app).get('/api/polls/s/short-1');

    expect(response.status).toBe(401);
  });

  it('allows any signed-in account to access a published private poll', async () => {
    findUnique.mockResolvedValue(makePoll({ isPublic: false }));

    const response = await request(app)
      .get('/api/polls/s/short-1')
      .set('Authorization', `Bearer ${participantToken}`);

    expect(response.status).toBe(200);
  });

  it('keeps unpublished polls visible only to their organizer', async () => {
    findUnique.mockResolvedValue(makePoll({ status: 'DRAFT', isPublic: true }));

    const anonymousResponse = await request(app).get('/api/polls/s/short-1');
    const participantResponse = await request(app)
      .get('/api/polls/s/short-1')
      .set('Authorization', `Bearer ${participantToken}`);
    const organizerResponse = await request(app)
      .get('/api/polls/s/short-1')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(anonymousResponse.status).toBe(404);
    expect(participantResponse.status).toBe(404);
    expect(organizerResponse.status).toBe(200);
  });
});
