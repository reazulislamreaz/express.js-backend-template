import { prisma } from '@/lib/database/index.js';
import type { User } from '@prisma/client';
import type { RegisterInput } from './auth.validation.js';

type RefreshRotationResult =
  { status: 'rotated'; user: User } | { status: 'inactive' } | { status: 'invalid' };

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: RegisterInput & { passwordHash: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async rotateRefreshToken(
    currentTokenHash: string,
    nextTokenHash: string,
    nextExpiresAt: Date,
  ): Promise<RefreshRotationResult> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const revoked = await tx.refreshToken.updateMany({
        where: {
          tokenHash: currentTokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });

      if (revoked.count !== 1) {
        return { status: 'invalid' };
      }

      const stored = await tx.refreshToken.findUnique({
        where: { tokenHash: currentTokenHash },
        include: { user: true },
      });

      if (!stored?.user.isActive) {
        return { status: 'inactive' };
      }

      await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: nextTokenHash,
          expiresAt: nextExpiresAt,
        },
      });

      return { status: 'rotated', user: stored.user };
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const authRepository = new AuthRepository();
