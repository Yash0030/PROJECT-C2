import { Router } from 'express';
import { db } from '../db/client.js';
import { requireSession } from '../middleware/auth.js';
import { generateAnonName } from '../services/anonNames.js';

const router = Router();

/**
 * GET /api/ghost/score
 */
router.get('/score', requireSession, async (req, res) => {
  try {
    const { rows } = await db().query(
      `SELECT ghost_score FROM users  WHERE id=$1`, [req.user.sub]
    );
    const { rows: eventRows } = await db().query(
      `SELECT COUNT(*) as count FROM ghost_events WHERE user_id=$1 AND reason='Ghost ID rotated'`, [req.user.sub]
    );
    const count = parseInt(eventRows[0].count, 10);
    const rotationsLeft = Math.max(0, 5 - count);

    res.json({ score: rows[0]?.ghost_score ?? 50, rotationsLeft });
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

/**
 * POST /api/ghost/rotate
 * Rotate identity across all active groups
 */
router.post('/rotate', requireSession, async (req, res) => {
  const client = await db().connect();
  try {
    const { rows: eventRows } = await client.query(
      `SELECT COUNT(*) as count FROM ghost_events WHERE user_id=$1 AND reason='Ghost ID rotated'`, [req.user.sub]
    );
    if (parseInt(eventRows[0].count, 10) >= 5) {
      client.release();
      return res.status(403).json({ error: 'Rotation limit reached' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT group_id FROM group_members WHERE user_id=$1`, [req.user.sub]
    );
    for (const row of rows) {
      await client.query(
        `UPDATE group_members SET anon_name=$1 WHERE group_id=$2 AND user_id=$3`,
        [generateAnonName(), row.group_id, req.user.sub]
      );
    }
    await client.query(
      `INSERT INTO ghost_events (user_id, delta, reason) VALUES ($1, 0, 'Ghost ID rotated')`,
      [req.user.sub]
    );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
