import { prisma } from '@/lib/database/index.js';
import type { PaginationInput } from './users.validation.js';

const userPublicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type PublicUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class UsersRepository {
  async findMany({ page, limit }: PaginationInput) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: userPublicSelect,
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  async findById(id: string): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
  }

  async exists(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return Boolean(user);
  }

  async update(id: string, data: { firstName?: string; lastName?: string }) {
    return prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
    });
  }

  async deactivate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userPublicSelect,
    });
  }
}

export const usersRepository = new UsersRepository();
