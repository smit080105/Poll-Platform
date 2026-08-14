import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Submit vote — double-layer one-person-one-vote protection
router.post('/:pollId', authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.id;

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

    // 4. Application-level check: has user already voted?
    const existingVote = await prisma.vote.findUnique({
      where: { userId_pollId: { userId, pollId } }
    });
    if (existingVote) {
      return res.status(409).json({ error: 'You have already voted in this poll.' });
    }

    // 5. Check max votes limit
    if (poll.maxVotes) {
      const voteCount = await prisma.vote.count({ where: { pollId } });
      if (voteCount >= poll.maxVotes) {
        return res.status(400).json({ error: 'This poll has reached its maximum number of votes.' });
      }
    }

    // 6. Create vote (DB constraint @@unique([userId, pollId]) is the second layer)
    const vote = await prisma.vote.create({
      data: { userId, pollId, optionId }
    });

    // 7. Get updated counts for real-time broadcast
    const updatedOptions = await prisma.option.findMany({
      where: { pollId },
      include: { _count: { select: { votes: true } } }
    });
    const totalVotes = await prisma.vote.count({ where: { pollId } });

    // 8. Broadcast via Socket.io to all clients watching this poll
    const io = req.app.get('io');
    io.to(`poll:${pollId}`).emit('vote-update', {
      pollId,
      options: updatedOptions.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt._count.votes
      })),
      totalVotes
    });

    res.status(201).json({
      message: 'Vote submitted successfully!',
      vote: { id: vote.id, pollId, optionId }
    });

  } catch (error) {
    // Handle unique constraint violation (DB-level one-person-one-vote)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already voted in this poll.' });
    }
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get poll results
router.get('/:pollId/results', async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: { _count: { select: { votes: true } } }
        },
        _count: { select: { votes: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    res.json({
      pollId: poll.id,
      title: poll.title,
      totalVotes: poll._count.votes,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt._count.votes,
        percentage: poll._count.votes > 0
          ? Math.round((opt._count.votes / poll._count.votes) * 100)
          : 0
      }))
    });
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Check if user has voted in a poll
router.get('/:pollId/check', authenticate, async (req, res) => {
  try {
    const { pollId } = req.params;

    const vote = await prisma.vote.findUnique({
      where: { userId_pollId: { userId: req.user.id, pollId } }
    });

    res.json({
      hasVoted: !!vote,
      votedOptionId: vote?.optionId || null
    });
  } catch (error) {
    console.error('Check vote error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
