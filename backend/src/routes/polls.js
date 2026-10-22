import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { generateShortId } from '../utils/generateId.js';
import { canAccessPoll } from '../utils/pollAccess.js';
import { validatePollInput } from '../utils/validators.js';
import { logError } from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

// Create poll (Organizer only)
router.post('/', authenticate, roleGuard('ORGANIZER'), async (req, res) => {
  try {
    const { title, description, type, options, startDate, endDate, maxVotes, isPublic } = req.body ?? {};

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
        title: title.trim(),
        description: description || '',
        type: type || 'SINGLE_CHOICE',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxVotes: maxVotes === undefined || maxVotes === null || maxVotes === '' ? null : Number(maxVotes),
        isPublic: isPublic !== undefined ? isPublic : true,
        status: 'DRAFT',
        organizerId: req.user.id,
        options: {
          create: options.map(opt => ({
            text: (typeof opt === 'string' ? opt : opt.text).trim()
          }))
        }
      },
      include: { options: true }
    });

    res.status(201).json(poll);
  } catch (error) {
    logError(req, error, 'Create poll request failed');
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
    logError(req, error, 'List polls request failed');
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
    logError(req, error, 'List public polls request failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get a published poll by shareable link. Private polls require an account.
router.get('/s/:shortId', optionalAuthenticate, async (req, res) => {
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
    if (!canAccessPoll(poll, req.user)) {
      if (!req.user && poll.status === 'ACTIVE' && !poll.isPublic) {
        return res.status(401).json({ error: 'Sign in to view this private poll.' });
      }
      return res.status(404).json({ error: 'Poll not found.' });
    }

    res.json(poll);
  } catch (error) {
    logError(req, error, 'Get poll request failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get poll by ID (organizer only — owner's own poll details/results)
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
    if (poll.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    res.json(poll);
  } catch (error) {
    logError(req, error, 'Get poll request failed');
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

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ errors: ['Poll data must be an object.'] });
    }

    const { title, description, type, options, startDate, endDate, maxVotes, isPublic } = req.body;
    const errors = validatePollInput({
      title: title === undefined ? poll.title : title,
      description: description === undefined ? poll.description : description,
      type: type === undefined ? poll.type : type,
      options: options === undefined ? (await prisma.option.findMany({
        where: { pollId: poll.id },
        select: { text: true }
      })) : options,
      startDate: startDate === undefined ? poll.startDate : startDate,
      endDate: endDate === undefined ? poll.endDate : endDate,
      maxVotes: maxVotes === undefined ? poll.maxVotes : maxVotes,
      isPublic: isPublic === undefined ? poll.isPublic : isPublic
    });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updated = await prisma.poll.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(maxVotes !== undefined && {
          maxVotes: maxVotes === null || maxVotes === '' ? null : Number(maxVotes)
        }),
        ...(isPublic !== undefined && { isPublic }),
        ...(options && {
          options: {
            deleteMany: {},
            create: options.map(opt => ({
              text: (typeof opt === 'string' ? opt : opt.text).trim()
            }))
          }
        })
      },
      include: { options: true }
    });

    res.json(updated);
  } catch (error) {
    logError(req, error, 'Update poll request failed');
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
    if (poll.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Poll is already published.' });
    }
    if (poll.options.length < 2) {
      return res.status(400).json({ error: 'Poll must have at least 2 options to publish.' });
    }
    if (new Date(poll.endDate) <= new Date()) {
      return res.status(400).json({ error: 'Cannot publish a poll whose end date has already passed.' });
    }

    const updated = await prisma.poll.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
      include: { options: true }
    });

    res.json(updated);
  } catch (error) {
    logError(req, error, 'Publish poll request failed');
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

    // All-or-nothing: votes → options → poll
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { pollId: req.params.id } }),
      prisma.option.deleteMany({ where: { pollId: req.params.id } }),
      prisma.poll.delete({ where: { id: req.params.id } })
    ]);

    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    logError(req, error, 'Delete poll request failed');
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;