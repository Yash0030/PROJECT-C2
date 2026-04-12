// import { Router } from 'express';
// import { randomUUID } from 'crypto';
// import { requireSession } from '../middleware/auth.js';
// import { getGhostScore } from '../services/ghostTrail.js';

// const router = Router();

// /**
//  * POST /api/session
//  * Returns a new anonymous session token (UUID). The client stores this locally.
//  * We never see the raw token again — only its SHA-256 hash server-side.
//  */
// router.post('/', (_req, res) => {
//   const token = randomUUID() + '-' + randomUUID(); // 73 chars, hard to brute force
//   res.json({ token });
// });

// /**
//  * GET /api/session/me
//  * Returns ghost score + suspension status for the current session.
//  */
// router.get('/me', requireSession, async (req, res) => {
//   try {
//     const score = await getGhostScore(req.user.sub);
//     res.json({ ghostScore: score });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// export default router;


import { Router } from 'express';
import { randomUUID } from 'crypto';
import { requireSession } from '../middleware/auth.js';
import { getGhostScore } from '../services/ghostTrail.js';
import { signToken } from '../services/jwt.js';

const router = Router();

/**
 * POST /api/session
 * Creates anonymous JWT. Client stores this, sends as Bearer on every request.
 */
router.post('/', async (_req, res) => {
  try {
    const anonId = randomUUID();

    const token = await signToken({
      sub: anonId,
      anon: true,
      email: null,
      emailVerified: false,
      ghostScore: 50,
    });

    res.json({ token, anonId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/session/me
 * Returns ghost score for the current session. Unchanged behavior.
 */
router.get('/me', requireSession, async (req, res) => {
  try {
    const score = await getGhostScore(req.user.sub);
    res.json({ ghostScore: score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;