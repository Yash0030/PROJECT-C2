import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireSession } from '../middleware/auth.js';
import { toNeighborhood, haversineKm } from '../services/location.js';

const router = Router();

/**
 * GET /api/places/tips?lat=&lng=&radiusKm=
 */
router.get('/tips', requireSession, async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm) || 2;

  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' });

  const degPerKm = 1 / 111;
  const latDelta = radiusKm * degPerKm;
  const lngDelta = radiusKm * degPerKm / Math.cos(lat * Math.PI / 180);

  try {
    const { rows } = await db().query(
      `SELECT id, neighborhood, content, upvotes, created_at
       FROM place_tips
       WHERE lat BETWEEN $1 AND $2 AND lng BETWEEN $3 AND $4
       ORDER BY upvotes DESC, created_at DESC LIMIT 20`,
      [lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/places/tips
 * Anonymous tip submission (typically triggered when a group expires).
 */
router.post('/tips', requireSession, async (req, res) => {
  const schema = z.object({
    lat:     z.number().min(-90).max(90),
    lng:     z.number().min(-180).max(180),
    content: z.string().min(10).max(240),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { lat, lng, content } = parsed.data;
  const neighborhood = toNeighborhood(lat, lng);

  try {
    const { rows } = await db().query(
      `INSERT INTO place_tips (lat, lng, neighborhood, content)
       VALUES ($1,$2,$3,$4) RETURNING id, neighborhood, content, upvotes, created_at`,
      [lat, lng, neighborhood, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/places/tips/:id/upvote
 */
router.post('/tips/:id/upvote', requireSession, async (req, res) => {
  try {
    const { rows } = await db().query(
      `UPDATE place_tips SET upvotes=upvotes+1 WHERE id=$1 RETURNING upvotes`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tip not found' });
    res.json({ upvotes: rows[0].upvotes });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
