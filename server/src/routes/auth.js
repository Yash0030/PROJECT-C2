import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/client.js';
import { signToken } from '../services/jwt.js';
import { requireSession } from '../middleware/auth.js';

const router = Router();

// ── Register ─────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = z.object({
      name:     z.string().min(2).max(50),
      email:    z.string().email(),
      password: z.string().min(6),
    }).parse(req.body);

    // Check if email already exists
    const existing = await db().query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await db().query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, ghost_score`,
      [name, email, passwordHash]
    );

    const user = rows[0];

    const token = await signToken({
      sub:         user.id,
      name:        user.name,
      email:       user.email,
      ghostScore:  user.ghost_score,
    });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Login ────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({
      email:    z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const { rows } = await db().query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.is_suspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = await signToken({
      sub:        user.id,
      name:       user.name,
      email:      user.email,
      ghostScore: user.ghost_score,
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Me ───────────────────────────────────────────────────
// GET /api/auth/me
router.get('/me', requireSession, async (req, res) => {
  const { rows } = await db().query(
    'SELECT id, name, email, ghost_score FROM users WHERE id = $1',
    [req.user.sub]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

export default router;