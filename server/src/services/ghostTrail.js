import { db } from '../db/client.js';

/**
 * Apply a delta to a session's ghost score and record the event.
 */
export async function applyGhostDelta(sessionHash, delta, reason) {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users
       SET ghost_score = GREATEST(0, LEAST(100, ghost_score + $1))
       WHERE id = $2`,
      [delta, sessionHash]
    );
    await client.query(
      `INSERT INTO ghost_events (user_id, delta, reason) VALUES ($1, $2, $3)`,
      [sessionHash, delta, reason]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getGhostScore(sessionHash) {
  const { rows } = await db().query(
    'SELECT ghost_score FROM users WHERE id = $1',
    [sessionHash]
  );
  return rows[0]?.ghost_score ?? 50;
}
