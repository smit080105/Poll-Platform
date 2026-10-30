import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { canAccessPoll } from '../utils/pollAccess.js';
import { logError } from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

// Record account eligibility separately from the option-only ballot.
router.post('/:pollId', authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    const optionId = req.body?.optionId;
    const userId = req.user.id;

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Vote data must be an object.' });
    }
    if (typeof optionId !== 'string' || optionId.trim().length === 0) {
      return res.status(400).json({ error: 'A valid option is required.' });
    }

    // 1. Check poll exists and is active
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }
    if (poll.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'This poll is not currently active.' });
    }

    // 2. Check time window
    const now = new Date();
    if (now < new Date(poll.startDate)) {
      return res.status(400).json({ error: 'This poll has not started yet.' });
    }
    if (now > new Date(poll.endDate)) {
      return res.status(400).json({ error: 'This poll has ended.' });
    }

    // 3. Check option belongs to this poll
    const validOption = poll.options.find(opt => opt.id === optionId);
    if (!validOption) {
      return res.status(400).json({ error: 'Invalid option for this poll.' });
    }

    // Locking the poll serializes submissions so duplicate checks and vote caps
    // remain correct without storing a voter identifier on the ballot.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Poll" WHERE id = ${pollId} FOR UPDATE`;

        const existingParticipation = await tx.participation.findUnique({
          where: { userId_pollId: { userId, pollId } }
        });
        if (existingParticipation) {
          throw new Error('ALREADY_VOTED');
        }

        if (poll.maxVotes !== null && poll.maxVotes !== undefined) {
          const voteCount = await tx.ballot.count({ where: { pollId } });
          if (voteCount >= poll.maxVotes) {
            throw new Error('MAX_VOTES_REACHED');
          }
        }

        await tx.participation.create({ data: { userId, pollId } });
        await tx.ballot.create({ data: { pollId, optionId } });
      });
    } catch (err) {
      if (err.message === 'ALREADY_VOTED' || err.code === 'P2002') {
        return res.status(409).json({ error: 'You have already voted in this poll.' });
      }
      if (err.message === 'MAX_VOTES_REACHED') {
        return res.status(400).json({ error: 'This poll has reached its maximum number of votes.' });
      }
      throw err;
    }

    // Do not publish per-option updates while voting is open: live tallies can
    // reveal an individual choice by comparing counts before and after a vote.
    res.status(201).json({
      message: 'Your ballot was recorded separately from your account.'
    });

  } catch (error) {
    // Handle unique constraint violation (DB-level one-person-one-vote)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already voted in this poll.' });
    }
    logError(req, error, 'Submit vote request failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Published public results are public; private polls require an account.
router.get('/:pollId/results', optionalAuthenticate, async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }
    if (!canAccessPoll(poll, req.user)) {
      if (!req.user && poll.status === 'ACTIVE' && !poll.isPublic) {
        return res.status(401).json({ error: 'Sign in to view this private poll.' });
      }
      return res.status(404).json({ error: 'Poll not found.' });
    }

    if (poll.status === 'ACTIVE' && new Date() <= new Date(poll.endDate)) {
      return res.status(409).json({ error: 'Results are hidden until this poll closes.' });
    }

    const [options, totalVotes] = await Promise.all([
      prisma.option.findMany({
        where: { pollId },
        include: { _count: { select: { ballots: true } } }
      }),
      prisma.ballot.count({ where: { pollId } })
    ]);

    res.json({
      pollId: poll.id,
      title: poll.title,
      totalVotes,
      options: options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt._count.ballots,
        percentage: totalVotes > 0
          ? Math.round((opt._count.ballots / totalVotes) * 100)
          : 0
      }))
    });
  } catch (error) {
    logError(req, error, 'Get poll results request failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Check if user has voted in a poll
router.get('/:pollId/check', authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });

    if (!poll || !canAccessPoll(poll, req.user)) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const participation = await prisma.participation.findUnique({
      where: { userId_pollId: { userId: req.user.id, pollId } }
    });

    res.json({ hasVoted: !!participation });
  } catch (error) {
    logError(req, error, 'Check vote request failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;