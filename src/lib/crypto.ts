import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { env } from '@/config/env.js';
import type { JwtPayload } from '@/shared/types/jwt.types.js';
import type { Role } from '@prisma/client';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: { sub: string; email: string; role: Role }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function getRefreshTokenExpiry(): Date {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * (multipliers[unit] ?? multipliers.d));
}
