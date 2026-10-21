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

const { default: voteRoutes } = await import('./votes.js');

const app = express();
app.use(express.json());
app.use('/api/votes', voteRoutes);

const secret = 'poll-results-test-secret';
const participantToken = jwt.sign({ id: 'participant-1', role: 'PARTICIPANT' }, secret);
const organizerToken = jwt.sign({ id: 'organizer-1', role: 'ORGANIZER' }, secret);

const makePoll = (overrides = {}) => ({
  id: 'poll-1',
  title: 'Community poll',
  status: 'ACTIVE',
  isPublic: true,
  organizerId: 'organizer-1',
  options: [],
  _count: { votes: 0 },
  ...overrides
});

describe('poll results access', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    findUnique.mockReset();
  });

  it('allows anonymous access to published public results', async () => {
    findUnique.mockResolvedValue(makePoll());

    const response = await request(app).get('/api/votes/poll-1/results');

    expect(response.status).toBe(200);
    expect(response.body.totalVotes).toBe(0);
  });

  it('requires sign-in for private poll results', async () => {
    findUnique.mockResolvedValue(makePoll({ isPublic: false }));

    const response = await request(app).get('/api/votes/poll-1/results');

    expect(response.status).toBe(401);
  });

  it('allows any signed-in account to view published private results', async () => {
    findUnique.mockResolvedValue(makePoll({ isPublic: false }));

    const response = await request(app)
      .get('/api/votes/poll-1/results')
      .set('Authorization', `Bearer ${participantToken}`);

    expect(response.status).toBe(200);
  });

  it('keeps draft results visible only to the organizer', async () => {
    findUnique.mockResolvedValue(makePoll({ status: 'DRAFT' }));

    const participantResponse = await request(app)
      .get('/api/votes/poll-1/results')
      .set('Authorization', `Bearer ${participantToken}`);
    const organizerResponse = await request(app)
      .get('/api/votes/poll-1/results')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(participantResponse.status).toBe(404);
    expect(organizerResponse.status).toBe(200);
  });
});
