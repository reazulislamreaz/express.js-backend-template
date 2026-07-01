import jwt from 'jsonwebtoken';
import type { JwtPayload } from './jwt.types.js';

export type { JwtPayload };

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
