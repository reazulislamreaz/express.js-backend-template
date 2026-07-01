import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/crypto.js';

describe('Crypto utilities', () => {
  it('hashes and verifies passwords', async () => {
    const password = 'TestPassword1';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
