import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import type { JwtPayload } from './jwt.types.js';

export type { JwtPayload };

export const JWT_ALGORITHM = 'HS256' as const;

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] }) as JwtPayload;
}

export function verifyAccessToken(token: string): JwtPayload {
  return verifyJwt(token, env.JWT_SECRET);
}
