import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const ALG = 'HS256';

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setJti(randomUUID())      // unique ID — needed for revocation
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}