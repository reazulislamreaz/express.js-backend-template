import jwt from 'jsonwebtoken';
import { describe, it, expect } from 'vitest';
import { generateAccessToken } from '@/lib/crypto.js';
import { verifyAccessToken, JWT_ALGORITHM } from '@/shared/types/jwt.js';
import { env } from '@/config/env.js';

describe('JWT security', () => {
  it('pins HS256 on sign and verify', () => {
    const token = generateAccessToken({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'USER',
    });

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('user@example.com');
    expect(JWT_ALGORITHM).toBe('HS256');
  });

  it('rejects tokens signed with a different algorithm', () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'user@example.com', role: 'USER' },
      env.JWT_SECRET,
      { algorithm: 'HS384' },
    );

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
