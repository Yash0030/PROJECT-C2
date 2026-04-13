import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireSession } from '../middleware/auth.js';
import { generateAnonName } from '../services/anonNames.js';
const router = Router();

/**
 * POST /api/groups/:id/join-requests
 * Submit a join request with a one-line reason.
 */
router.post('/:id/join-requests', requireSession, async (req, res) => {
  const schema = z.object({ reason: z.string().min(5).max(160) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { reason } = parsed.data;
  const groupId = req.params.id;

  try {
    // Check group exists and not expired
    const { rows: gRows } = await db().query(
      `SELECT id, min_ghost_score, member_count, max_members FROM groups
       WHERE id=$1 AND expires_at > NOW()`, [groupId]
    );
    if (!gRows[0]) return res.status(404).json({ error: 'Group not found' });

    const group = gRows[0];

    if (req.user.ghostScore < group.min_ghost_score) {
      return res.status(403).json({ error: 'Ghost trail score too low for this group' });
    }
    if (group.member_count >= group.max_members) {
      return res.status(409).json({ error: 'Group is full' });
    }

    // Check if already a member
    const { rows: memRows } = await db().query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_kicked=FALSE`,
      [groupId, req.user.sub]
    );
    if (memRows[0]) return res.status(409).json({ error: 'Already a member' });

    await db().query(
      `INSERT INTO join_requests (group_id, user_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_id, user_id) DO UPDATE SET reason=EXCLUDED.reason, status='pending'`,
      [groupId, req.user.sub, reason]
    );

    // Notify creator via socket
    const io = req.app.get('io');
    io?.to(`creator:${groupId}`).emit('join_request', { groupId });

    res.status(201).json({ status: 'pending' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id/join-requests
 * Creator sees pending reasons (anonymised — no session hash exposed).
 */
router.get('/:id/join-requests', requireSession, async (req, res) => {
  const groupId = req.params.id;
  try {
    const { rows: creatorCheck } = await db().query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_creator=TRUE`,
      [groupId, req.user.sub]
    );
    if (!creatorCheck[0]) return res.status(403).json({ error: 'Only the creator can view requests' });

    const { rows } = await db().query(
      `SELECT id, reason, status, created_at FROM join_requests
       WHERE group_id=$1 AND status='pending' ORDER BY created_at ASC`,
      [groupId]
    );
    // Note: user_id is deliberately NOT returned
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/groups/:id/join-requests/:requestId
 * Creator approves or rejects.
 */
router.patch('/:id/join-requests/:requestId', requireSession, async (req, res) => {
  const schema = z.object({ action: z.enum(['approve', 'reject']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'action must be approve or reject' });

  const { action } = parsed.data;
  const { id: groupId, requestId } = req.params;
  const client = await db().connect();

  try {
    // Verify creator
    const { rows: creatorCheck } = await client.query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_creator=TRUE`,
      [groupId, req.user.sub]
    );
    if (!creatorCheck[0]) return res.status(403).json({ error: 'Not the group creator' });

    const { rows: reqRows } = await client.query(
      `SELECT * FROM join_requests WHERE id=$1 AND group_id=$2 AND status='pending'`,
      [requestId, groupId]
    );
    if (!reqRows[0]) return res.status(404).json({ error: 'Request not found' });

    const jr = reqRows[0];

    await client.query('BEGIN');
    await client.query(
      `UPDATE join_requests SET status=$1 WHERE id=$2`, [action === 'approve' ? 'approved' : 'rejected', requestId]
    );

    if (action === 'approve') {
      const anonName = generateAnonName();
      await client.query(
        `INSERT INTO group_members (group_id, user_id, anon_name) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING`, [groupId, jr.user_id, anonName]
      );
      await client.query(
        `UPDATE groups SET member_count = member_count + 1 WHERE id=$1`, [groupId]
      );
    }

    await client.query('COMMIT');

    // Notify the requester via their personal socket room
    const io = req.app.get('io');
    io?.to(`session:${jr.user_id}`).emit('join_request_result', { groupId, status: action === 'approve' ? 'approved' : 'rejected' });

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
