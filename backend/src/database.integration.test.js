import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('database integrity constraints', () => {
  it('rejects a vote whose option belongs to a different poll', async () => {
    const suffix = randomUUID();
    const userId = randomUUID();
    const firstPollId = randomUUID();
    const secondPollId = randomUUID();
    const firstOptionId = randomUUID();
    const secondOptionId = randomUUID();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      await prisma.user.create({
        data: {
          id: userId,
          email: `${suffix}@example.com`,
          password: 'not-a-real-password',
          name: 'Integration Test'
        }
      });

      await prisma.poll.createMany({
        data: [
          {
            id: firstPollId,
            shortId: `${suffix.slice(0, 8)}a`,
            title: 'First integration poll',
            startDate: now,
            endDate: tomorrow,
            organizerId: userId
          },
          {
            id: secondPollId,
            shortId: `${suffix.slice(0, 8)}b`,
            title: 'Second integration poll',
            startDate: now,
            endDate: tomorrow,
            organizerId: userId
          }
        ]
      });

      await prisma.option.createMany({
        data: [
          { id: firstOptionId, pollId: firstPollId, text: 'First option' },
          { id: secondOptionId, pollId: secondPollId, text: 'Second option' }
        ]
      });

      const participation = await prisma.participation.create({
        data: { userId, pollId: firstPollId }
      });
      const ballot = await prisma.ballot.create({
        data: { pollId: firstPollId, optionId: firstOptionId }
      });

      expect(participation).not.toHaveProperty('optionId');
      expect(ballot).not.toHaveProperty('userId');

      await expect(prisma.ballot.create({
        data: { pollId: firstPollId, optionId: secondOptionId }
      })).rejects.toMatchObject({ code: 'P2003' });
      await expect(prisma.participation.create({
        data: { userId, pollId: firstPollId }
      })).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await prisma.ballot.deleteMany({ where: { pollId: { in: [firstPollId, secondPollId] } } });
      await prisma.participation.deleteMany({ where: { userId } });
      await prisma.option.deleteMany({ where: { pollId: { in: [firstPollId, secondPollId] } } });
      await prisma.poll.deleteMany({ where: { id: { in: [firstPollId, secondPollId] } } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  }, 15000);
});
