import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/modules/auth/auth.validation.js';

describe('Auth Validation', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Password1',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects weak passwords', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'Password1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
