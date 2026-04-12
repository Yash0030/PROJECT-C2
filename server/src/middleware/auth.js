// // server/src/middleware/auth.js  
// import crypto from 'crypto';
// import { db } from '../db/client.js';

// /**
//  * Reads the X-Session-Token header, hashes it, looks up or creates the
//  * session row, and attaches req.sessionHash + req.ghostScore.
//  */
// export async function requireSession(req, res, next) {
//   const token = req.headers['x-session-token'];
//   if (!token || typeof token !== 'string' || token.length < 16) {
//     return res.status(401).json({ error: 'Missing or invalid session token' });
//   }

//   const hash = crypto.createHash('sha256').update(token).digest('hex');

//   try {
//     const { rows } = await db().query(
//       `INSERT INTO sessions (token_hash)
//        VALUES ($1)
//        ON CONFLICT (token_hash) DO UPDATE SET token_hash = EXCLUDED.token_hash
//        RETURNING token_hash, ghost_score, is_suspended`,
//       [hash]
//     );
//     const session = rows[0];
//     if (session.is_suspended) {
//       return res.status(403).json({ error: 'Session suspended' });
//     }
//     req.sessionHash = session.token_hash;
//     req.ghostScore  = session.ghost_score;
//     next();
//   } catch (err) {
//     console.error('requireSession error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

import { verifyToken } from '../services/jwt.js';
import { redis } from '../db/redis.js';

export async function requireSession(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = header.slice(7);

  try {
    const payload = await verifyToken(token);

    // Check Redis revocation list (for suspended/kicked users)
    const isRevoked = await redis().get(`revoked:${payload.jti}`);
    if (isRevoked) {
      return res.status(403).json({ error: 'Session suspended' });
    }

    // Drop-in replacements for req.sessionHash and req.ghostScore
    // so all your existing routes work without changes
    req.sessionHash = payload.sub;
    req.ghostScore  = payload.ghostScore ?? 50;
    req.user        = payload;
    next();
  } catch (err) {
    console.error('requireSession error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}