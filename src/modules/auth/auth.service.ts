import { env } from '@/config/env.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
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
    const nextRefreshToken = generateRefreshToken();
    const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);
    const nextExpiresAt = getRefreshTokenExpiry();
    const rotated = await authRepository.rotateRefreshToken(
      hashRefreshToken(refreshToken),
      nextRefreshTokenHash,
      nextExpiresAt,
    );

    if (rotated.status === 'invalid') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (rotated.status === 'reused') {
      throw new UnauthorizedError(
        'Refresh token reuse detected. All sessions have been revoked for security.',
      );
    }

    if (rotated.status === 'inactive') {
      throw new UnauthorizedError('Account is deactivated');
    }

    const accessToken = generateAccessToken({
      sub: rotated.user.id,
      email: rotated.user.email,
      role: rotated.user.role,
    });

    return {
      user: toSafeUser(rotated.user),
      tokens: {
        accessToken,
        refreshToken: nextRefreshToken,
        expiresIn: env.JWT_EXPIRES_IN,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await authRepository.revokeRefreshTokenByHash(hashRefreshToken(refreshToken));
  }

  private async issueTokens(userId: string, email: string, role: AuthResponse['user']['role']) {
    const accessToken = generateAccessToken({ sub: userId, email, role });
    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiry();

    await authRepository.createRefreshToken(userId, hashRefreshToken(refreshToken), expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }
}

export const authService = new AuthService();
