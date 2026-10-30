import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const findUnique = jest.fn();
const participationFindUnique = jest.fn();
const optionFindMany = jest.fn();
const ballotCount = jest.fn();
const participationCreate = jest.fn();
const ballotCreate = jest.fn();
const queryRaw = jest.fn();
const transaction = jest.fn();

const tx = {
  $queryRaw: queryRaw,
  participation: { findUnique: participationFindUnique, create: participationCreate },
  ballot: { count: ballotCount, create: ballotCreate }
};

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      this.poll = { findUnique };
      this.participation = { findUnique: participationFindUnique };
      this.option = { findMany: optionFindMany };
      this.ballot = { count: ballotCount };
      this.$transaction = transaction;
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
  startDate: new Date(Date.now() - 60_000),
  endDate: new Date(Date.now() - 1_000),
  isPublic: true,
  organizerId: 'organizer-1',
  options: [],
  ...overrides
});

describe('poll results access', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    findUnique.mockReset();
    participationFindUnique.mockReset();
    optionFindMany.mockReset();
    ballotCount.mockReset();
    participationCreate.mockReset();
    ballotCreate.mockReset();
    queryRaw.mockReset();
    transaction.mockReset();
    optionFindMany.mockResolvedValue([]);
    ballotCount.mockResolvedValue(0);
    transaction.mockImplementation(callback => callback(tx));
  });

  it('allows anonymous access to published public results', async () => {
    findUnique.mockResolvedValue(makePoll({ endDate: new Date(Date.now() - 1_000) }));
    optionFindMany.mockResolvedValue([]);
    ballotCount.mockResolvedValue(0);

    const response = await request(app).get('/api/votes/poll-1/results');

    expect(response.status).toBe(200);
    expect(response.body.totalVotes).toBe(0);
  });

  it('returns closed-poll aggregate counts and percentages', async () => {
    findUnique.mockResolvedValue(makePoll());
    optionFindMany.mockResolvedValue([
      { id: 'option-1', text: 'Option one', _count: { ballots: 3 } },
      { id: 'option-2', text: 'Option two', _count: { ballots: 1 } }
    ]);
    ballotCount.mockResolvedValue(4);

    const response = await request(app).get('/api/votes/poll-1/results');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalVotes: 4,
      options: [
        { id: 'option-1', votes: 3, percentage: 75 },
        { id: 'option-2', votes: 1, percentage: 25 }
      ]
    });
  });

  it('withholds results while an active poll is open', async () => {
    findUnique.mockResolvedValue(makePoll({ endDate: new Date(Date.now() + 60_000) }));

    const response = await request(app).get('/api/votes/poll-1/results');

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/hidden until this poll closes/i);
    expect(optionFindMany).not.toHaveBeenCalled();
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

  it('stores participation and a ballot separately without returning the choice', async () => {
    findUnique.mockResolvedValue(makePoll({
      endDate: new Date(Date.now() + 60_000),
      options: [{ id: 'option-1' }]
    }));
    participationFindUnique.mockResolvedValue(null);
    ballotCount.mockResolvedValue(0);

    const response = await request(app)
      .post('/api/votes/poll-1')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ optionId: 'option-1' });

    expect(response.status).toBe(201);
    expect(participationCreate).toHaveBeenCalledWith({
      data: { userId: 'participant-1', pollId: 'poll-1' }
    });
    expect(ballotCreate).toHaveBeenCalledWith({
      data: { pollId: 'poll-1', optionId: 'option-1' }
    });
    expect(response.body).not.toHaveProperty('vote');
    expect(response.body).not.toHaveProperty('optionId');
  });

  it.each([
    ['missing body', undefined],
    ['non-object body', 'invalid'],
    ['missing option id', {}],
    ['non-string option id', { optionId: 1 }],
    ['empty option id', { optionId: '   ' }]
  ])('rejects a vote with %s before looking up the poll', async (_label, body) => {
    const requestBuilder = request(app)
      .post('/api/votes/poll-1')
      .set('Authorization', `Bearer ${participantToken}`);
    const response = body === undefined
      ? await requestBuilder
      : await requestBuilder.send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/vote data must be an object|valid option is required/i);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects a second ballot for the same account without recording another choice', async () => {
    findUnique.mockResolvedValue(makePoll({
      endDate: new Date(Date.now() + 60_000),
      options: [{ id: 'option-1' }]
    }));
    participationFindUnique.mockResolvedValue({ id: 'participation-1' });

    const response = await request(app)
      .post('/api/votes/poll-1')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ optionId: 'option-1' });

    expect(response.status).toBe(409);
    expect(ballotCreate).not.toHaveBeenCalled();
  });

  it('enforces the poll-wide ballot limit atomically', async () => {
    findUnique.mockResolvedValue(makePoll({
      endDate: new Date(Date.now() + 60_000),
      maxVotes: 1,
      options: [{ id: 'option-1' }]
    }));
    participationFindUnique.mockResolvedValue(null);
    ballotCount.mockResolvedValue(1);

    const response = await request(app)
      .post('/api/votes/poll-1')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ optionId: 'option-1' });

    expect(response.status).toBe(400);
    expect(participationCreate).not.toHaveBeenCalled();
    expect(ballotCreate).not.toHaveBeenCalled();
  });

  it('checks participation without revealing which option was selected', async () => {
    findUnique.mockResolvedValue(makePoll());
    participationFindUnique.mockResolvedValue({ id: 'participation-1' });

    const response = await request(app)
      .get('/api/votes/poll-1/check')
      .set('Authorization', `Bearer ${participantToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ hasVoted: true });
    expect(response.body).not.toHaveProperty('votedOptionId');
  });
});
