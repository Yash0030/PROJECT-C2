import { Router } from 'express';
import { db } from '../db/client.js';
import { requireSession } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/ghost/score
 */
router.get('/score', requireSession, async (req, res) => {
  try {
    const { rows } = await db().query(
      `SELECT ghost_score FROM users  WHERE id=$1`, [req.user.sub]
    );
    res.json({ score: rows[0]?.ghost_score ?? 50 });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/ghost/history  (last 20 events for the current session)
 */
router.get('/history', requireSession, async (req, res) => {
  try {
    const { rows } = await db().query(
      `SELECT delta, reason, created_at FROM ghost_events
       WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
