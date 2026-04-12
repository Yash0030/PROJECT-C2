import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireSession } from '../middleware/auth.js';
import { isBlocked, toxicityScore } from '../services/contentFilter.js';

const router = Router();

/**
 * GET /api/groups/:id/messages?before=&limit=
 */
router.get('/:id/messages', requireSession, async (req, res) => {
  const groupId = req.params.id;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before || new Date().toISOString();

  try {
    // Must be a member
    const { rows: mem } = await db().query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_kicked=FALSE`,
      [groupId, req.user.sub]
    );
    if (!mem[0]) return res.status(403).json({ error: 'Not a member of this group' });

    const { rows } = await db().query(
  `SELECT id, user_id, content, flag_count, is_hidden, created_at,
          (user_id = $1) AS is_mine
   FROM messages
   WHERE group_id=$2 AND created_at < $3 AND is_hidden=FALSE
   ORDER BY created_at DESC LIMIT $4`,
  [req.user.sub, groupId, before, limit]
);
    res.json(rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/groups/:id/messages
 */
router.post('/:id/messages', requireSession, async (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(500) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid message' });

  const { content } = parsed.data;
  const groupId = req.params.id;

  if (isBlocked(content)) {
    return res.status(422).json({ error: 'Message could not be sent' }); // vague on purpose
  }

  try {
    // Member check
    const { rows: mem } = await db().query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_kicked=FALSE`,
      [groupId, req.user.sub]
    );
    if (!mem[0]) return res.status(403).json({ error: 'Not a member' });

    // Silence mode check
    const { rows: gRows } = await db().query(
      `SELECT silence_start, silence_end, expires_at FROM groups WHERE id=$1`, [groupId]
    );
    const group = gRows[0];
    if (!group || new Date(group.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Group has expired' });
    }

    if (group.silence_start != null && group.silence_end != null) {
      const hour = new Date().getUTCHours() + 5.5; // IST offset; use proper timezone in prod
      const h = Math.floor(hour) % 24;
      if (h >= group.silence_start && h < group.silence_end) {
        return res.status(403).json({ error: 'Group is in silence mode right now' });
      }
    }

    const { rows } = await db().query(
      `INSERT INTO messages (group_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING id, content, created_at`,
      [groupId, req.user.sub, content]
    );
    const msg = rows[0];

    // Update group health score
    const tox = toxicityScore(content);
    if (tox > 0) {
      await db().query(
        `UPDATE groups SET health_score = GREATEST(0, health_score - $1) WHERE id=$2`,
        [tox * 0.1, groupId]
      );
    }

    // Broadcast via socket
    const io = req.app.get('io');
    io?.to(groupId).emit('new_message', {
      id: msg.id,
      content: msg.content,
      isMine: false,
      createdAt: msg.created_at,
    });

    res.status(201).json({ ...msg, isMine: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/groups/:id/messages/:msgId/flag
 */
router.post('/:id/messages/:msgId/flag', requireSession, async (req, res) => {
  const { id: groupId, msgId } = req.params;
  const client = await db().connect();

  try {
    await client.query('BEGIN');

    // Insert flag (unique per session)
    const { rowCount } = await client.query(
      `INSERT INTO message_flags (message_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [msgId, req.user.sub]
    );
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Already flagged' });
    }

    const { rows } = await client.query(
      `UPDATE messages SET flag_count = flag_count + 1 WHERE id=$1 RETURNING flag_count`,
      [msgId]
    );
    const flagCount = rows[0].flag_count;

    // 3 flags → hide message
    if (flagCount >= 3) {
      await client.query(`UPDATE messages SET is_hidden=TRUE WHERE id=$1`, [msgId]);
    }

    // 5 flags → suspend group (notify ops)
    if (flagCount >= 5) {
      await client.query(`UPDATE groups SET health_score=0 WHERE id=$1`, [groupId]);
      const io = req.app.get('io');
      io?.to(groupId).emit('group_suspended', { groupId });
    }

    await client.query('COMMIT');
    res.json({ flagCount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
