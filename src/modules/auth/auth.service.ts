import { env } from '@/config/env.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from '@/lib/crypto.js';
import { ConflictError, UnauthorizedError } from '@/shared/errors/index.js';
import { authRepository } from './auth.repository.js';
import type { RegisterInput, LoginInput } from './auth.validation.js';
import type { AuthResponse } from './auth.types.js';
import { toSafeUser } from './auth.types.js';

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.create({ ...input, passwordHash });

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return { user: toSafeUser(user), tokens };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return { user: toSafeUser(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const stored = await authRepository.findRefreshToken(refreshToken);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    await authRepository.revokeRefreshToken(refreshToken);

    const tokens = await this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );

    return { user: toSafeUser(stored.user), tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    const stored = await authRepository.findRefreshToken(refreshToken);
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(refreshToken);
    }
  }

  private async issueTokens(userId: string, email: string, role: AuthResponse['user']['role']) {
    const accessToken = generateAccessToken({ sub: userId, email, role });
    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    await authRepository.createRefreshToken(userId, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }
}

export const authService = new AuthService();
