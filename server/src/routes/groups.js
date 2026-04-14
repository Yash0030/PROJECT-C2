import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireSession } from '../middleware/auth.js';
import { toNeighborhood, haversineKm } from '../services/location.js';
import { generateAnonName } from '../services/anonNames.js';
const router = Router();

const TEMPLATES = ['general', 'new-here', 'festival', 'night-out', 'transit-delay', 'local-issue', 'book-readers', 'alert'];

const CreateGroupSchema = z.object({
  name:           z.string().min(3).max(60),
  description:    z.string().max(200).optional(),
  template:       z.enum(TEMPLATES).default('general'),
  lat:            z.number().min(-90).max(90),
  lng:            z.number().min(-180).max(180),
  radiusKm:       z.number().min(0.1).max(5).default(1),
  lifetimeHours:  z.number().int().min(1).max(120).default(24),
  maxMembers:     z.number().int().min(2).max(40).default(40),
  minGhostScore:  z.number().int().min(0).max(100).default(0),
  silenceStart:   z.number().int().min(0).max(23).optional(),
  silenceEnd:     z.number().int().min(0).max(23).optional(),
  isAlert:        z.boolean().default(false),
});

/**
 * POST /api/groups
 * Create a new group. Creator auto-joins.
 */
router.post('/', requireSession, async (req, res) => {
  const parsed = CreateGroupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const d = parsed.data;

  // Ghost score gate
  if (req.user.ghostScore < d.minGhostScore) {
    return res.status(403).json({ error: 'Your ghost trail score is too low to create this group' });
  }

  const neighborhood = toNeighborhood(d.lat, d.lng);
  const expiresAt = new Date(Date.now() + d.lifetimeHours * 3600_000);

  // Alerts: override max members + lifetime
  const isAlert = d.template === 'alert' || d.isAlert;
  const finalMaxMembers   = isAlert ? 99999 : d.maxMembers;
  const finalExpiresAt    = isAlert ? new Date(Date.now() + 6 * 3600_000) : expiresAt;

  const client = await db().connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO groups
         (name, description, template, creator_id, lat, lng, neighborhood,
          radius_km, max_members, lifetime_hours, min_ghost_score,
          silence_start, silence_end, is_alert, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [d.name, d.description ?? null, d.template, req.user.sub,
       d.lat, d.lng, neighborhood, d.radiusKm,
       finalMaxMembers, d.lifetimeHours, d.minGhostScore,
       d.silenceStart ?? null, d.silenceEnd ?? null, isAlert, finalExpiresAt]
    );
    const group = rows[0];

    // Auto-join creator


// Auto-join creator with anonymous name
const creatorAnonName = generateAnonName();
await client.query(
  `INSERT INTO group_members (group_id, user_id, anon_name, is_creator) VALUES ($1,$2,$3,TRUE)`,
  [group.id, req.user.sub, creatorAnonName]
);

    await client.query('COMMIT');
    res.status(201).json(sanitiseGroup(group, req.user.sub));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not create group' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/groups?lat=&lng=&radiusKm=
 * List nearby active groups, ordered by distance.
 */
router.get('/', requireSession, async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm) || 3;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  try {
    // Simple bounding-box filter for Phase 1; replace with earthdistance in prod
    const degPerKm = 1 / 111;
    const latDelta = radiusKm * degPerKm;
    const lngDelta = radiusKm * degPerKm / Math.cos(lat * Math.PI / 180);

    const { rows } = await db().query(
      `SELECT g.*, gm.user_id IS NOT NULL AS is_member
       FROM groups g
       LEFT JOIN group_members gm
         ON gm.group_id = g.id AND gm.user_id = $1 AND gm.is_kicked = FALSE
       WHERE g.expires_at > NOW()
         AND g.lat BETWEEN $2 AND $3
         AND g.lng BETWEEN $4 AND $5
       ORDER BY g.created_at DESC
       LIMIT 50`,
      [req.user.sub, lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta]
    );

    const groups = rows
      .map(g => ({
        ...sanitiseGroup(g, req.user.sub),
        distanceKm: +haversineKm(lat, lng, g.lat, g.lng).toFixed(2),
        isMember: g.is_member,
      }))
      .filter(g => g.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/groups/:id
 */
router.get('/:id', requireSession, async (req, res) => {
  try {
    const { rows } = await db().query(
      `SELECT g.*, gm.user_id IS NOT NULL AS is_member, gm.is_creator AS is_creator
       FROM groups g
       LEFT JOIN group_members gm
         ON gm.group_id = g.id AND gm.user_id = $1
       WHERE g.id = $2`,
      [req.user.sub, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Group not found' });
    const isExpired = new Date(rows[0].expires_at) < new Date();
    res.json({ 
      ...sanitiseGroup(rows[0], req.user.sub), 
      isMember: rows[0].is_member, 
      isCreator: rows[0].is_creator,
      isExpired,
      lat: isExpired ? rows[0].lat : undefined,
      lng: isExpired ? rows[0].lng : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/groups/:id/members/:sessionHash  (creator kick)
 */
router.delete('/:id/members/:targetHash', requireSession, async (req, res) => {
  const { id, targetHash } = req.params;
  try {
    // Verify requester is creator
    const { rows } = await db().query(
      `SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2 AND is_creator=TRUE`,
      [id, req.user.sub]
    );
    if (!rows[0]) return res.status(403).json({ error: 'Only the creator can kick members' });

    await db().query(
      `UPDATE group_members SET is_kicked=TRUE WHERE group_id=$1 AND user_id=$2`,
      [id, targetHash]
    );

    // Ghost trail penalty
    await db().query(
      `UPDATE users  SET ghost_score = GREATEST(0, ghost_score - 5) WHERE id=$1`,
      [targetHash]
    );
    await db().query(
      `INSERT INTO ghost_events (user_id, delta, reason) VALUES ($1, -5, 'kicked from group')`,
      [targetHash]
    );

    // Notify via socket
    const io = req.app.get('io');
    io?.to(id).emit('member_kicked', { sessionHash: targetHash });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Helper ────────────────────────────────────────────────────────────────────
function sanitiseGroup(g, _sessionHash) {
  return {
    id:             g.id,
    name:           g.name,
    description:    g.description,
    template:       g.template,
    neighborhood:   g.neighborhood,   // fuzzy — never lat/lng
    radiusKm:       g.radius_km,
    maxMembers:     g.max_members,
    memberCount:    g.member_count,
    minGhostScore:  g.min_ghost_score,
    silenceStart:   g.silence_start,
    silenceEnd:     g.silence_end,
    isAlert:        g.is_alert,
    healthScore:    g.health_score,
    expiresAt:      g.expires_at,
    createdAt:      g.created_at,
    // isCreator: determined by caller
  };
}

export default router;
