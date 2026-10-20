import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { validateEmail } from '../utils/validators.js';

const router = Router();
const prisma = new PrismaClient();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const normalizeEmail = (value = '') => value.trim().toLowerCase();
const normalizeName = (value = '') => value.trim();
const matchesOrganizerCode = (providedCode, configuredCode) => {
  if (typeof providedCode !== 'string') {
    return false;
  }

  const providedHash = createHash('sha256').update(providedCode).digest();
  const configuredHash = createHash('sha256').update(configuredCode).digest();
  return timingSafeEqual(providedHash, configuredHash);
};

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, role, organizerCode } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const cleanedEmail = normalizeEmail(email);
    const cleanedName = normalizeName(name);

    if (!cleanedEmail || !password || !cleanedName) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (cleanedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
    }

    if (!validateEmail(cleanedEmail)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const userRole = role === undefined
      ? 'PARTICIPANT'
      : typeof role === 'string' ? role.trim().toUpperCase() : '';
    if (!['ORGANIZER', 'PARTICIPANT'].includes(userRole)) {
      return res.status(400).json({ error: 'Role must be ORGANIZER or PARTICIPANT.' });
    }

    if (userRole === 'ORGANIZER') {
      const configuredCode = process.env.ORGANIZER_SIGNUP_CODE;
      if (!configuredCode) {
        return res.status(503).json({ error: 'Organizer registrations are not enabled.' });
      }
      if (!matchesOrganizerCode(organizerCode, configuredCode)) {
        return res.status(403).json({ error: 'A valid organizer registration code is required.' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: cleanedEmail,
        password: hashedPassword,
        name: cleanedName,
        role: userRole
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanedEmail = normalizeEmail(email);

    if (!cleanedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!validateEmail(cleanedEmail)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;