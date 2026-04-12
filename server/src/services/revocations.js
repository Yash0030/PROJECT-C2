import { redis } from '../db/redis.js';

/**
 * Revoke a JWT by its jti claim. TTL matches token expiry
 * so Redis doesn't store dead keys forever.
 * Call this from your existing kick/suspend logic.
 */
export async function revokeToken(jti, expAt) {
  const ttlSeconds = Math.floor((expAt * 1000 - Date.now()) / 1000);
  if (ttlSeconds > 0) {
    await redis().set(`revoked:${jti}`, '1', 'EX', ttlSeconds);
  }
}