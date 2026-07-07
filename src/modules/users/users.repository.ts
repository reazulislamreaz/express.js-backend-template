import { prisma } from '@/lib/database/index.js';
import type { User } from '@prisma/client';
import type { PaginationInput } from './users.validation.js';

export class UsersRepository {
  async findMany({ page, limit }: PaginationInput) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
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
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivate(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const usersRepository = new UsersRepository();
