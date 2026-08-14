import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { generateShortId } from '../utils/generateId.js';
import { validatePollInput } from '../utils/validators.js';

const router = Router();
const prisma = new PrismaClient();

// Create poll (Organizer only)
router.post('/', authenticate, roleGuard('ORGANIZER'), async (req, res) => {
  try {
    const { title, description, type, options, startDate, endDate, maxVotes, isPublic } = req.body;

    const errors = validatePollInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    let shortId = generateShortId();
    while (await prisma.poll.findUnique({ where: { shortId } })) {
      shortId = generateShortId();
    }

    const poll = await prisma.poll.create({
      data: {
        shortId,
        title,
        description: description || '',
        type: type || 'SINGLE_CHOICE',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxVotes: maxVotes || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        status: 'DRAFT',
        organizerId: req.user.id,
        options: {
          create: options.map(opt => ({ text: typeof opt === 'string' ? opt : opt.text }))
        }
      },
      include: { options: true }
    });

    res.status(201).json(poll);
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// List organizer's polls
router.get('/', authenticate, roleGuard('ORGANIZER'), async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      where: { organizerId: req.user.id },
      include: {
        options: true,
        _count: { select: { votes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(polls);
  } catch (error) {
    console.error('List polls error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get public active polls (no auth required)
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const polls = await prisma.poll.findMany({
      where: {
        isPublic: true,
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        options: true,
        organizer: { select: { name: true } },
        _count: { select: { votes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(polls);
  } catch (error) {
    console.error('List public polls error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get poll by shortId (shareable link)
router.get('/s/:shortId', async (req, res) => {
  try {
    const poll = await prisma.poll.findUnique({
      where: { shortId: req.params.shortId },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        organizer: { select: { name: true } },
        _count: { select: { votes: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    res.json(poll);
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get poll by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: req.params.id },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        organizer: { select: { name: true } },
        _count: { select: { votes: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    res.json(poll);
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update poll (Organizer only, draft polls only)
router.put('/:id', authenticate, roleGuard('ORGANIZER'), async (req, res) => {
  try {
    const poll = await prisma.poll.findUnique({ where: { id: req.params.id } });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }
    if (poll.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    if (poll.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot edit an active poll.' });
    }

    const { title, description, type, options, startDate, endDate, maxVotes, isPublic } = req.body;

    const updated = await prisma.poll.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(maxVotes !== undefined && { maxVotes }),
        ...(isPublic !== undefined && { isPublic }),
        ...(options && {
          options: {
            deleteMany: {},
            create: options.map(opt => ({ text: typeof opt === 'string' ? opt : opt.text }))
          }
        })
      },
      include: { options: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update poll error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Publish poll (set status to ACTIVE)
router.post('/:id/publish', authenticate, roleGuard('ORGANIZER'), async (req, res) => {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: req.params.id },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }
    if (poll.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    if (poll.options.length < 2) {
      return res.status(400).json({ error: 'Poll must have at least 2 options to publish.' });
    }

    const updated = await prisma.poll.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
      include: { options: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Publish poll error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete poll (Organizer only)
router.delete('/:id', authenticate, roleGuard('ORGANIZER'), async (req, res) => {
  try {
    const poll = await prisma.poll.findUnique({ where: { id: req.params.id } });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }
    if (poll.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Delete in order: votes → options → poll
    await prisma.vote.deleteMany({ where: { pollId: req.params.id } });
    await prisma.option.deleteMany({ where: { pollId: req.params.id } });
    await prisma.poll.delete({ where: { id: req.params.id } });

    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
