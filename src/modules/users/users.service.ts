import { NotFoundError, ForbiddenError } from '@/shared/errors/index.js';
import { usersRepository } from './users.repository.js';
import { userActivityRepository } from './users.activity.repository.js';
import type { PaginationInput, UpdateUserInput } from './users.validation.js';
import { env } from '@/config/env.js';

export class UsersService {
  async list(pagination: PaginationInput) {
    const { users, total } = await usersRepository.findMany(pagination);

    return {
      users,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getById(id: string, requesterId: string, requesterRole: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (requesterRole !== 'ADMIN' && requesterId !== id) {
      throw new ForbiddenError('You can only view your own profile');
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async update(id: string, input: UpdateUserInput, requesterId: string, requesterRole: string) {
    if (requesterRole !== 'ADMIN' && requesterId !== id) {
      throw new ForbiddenError('You can only update your own profile');
    }

    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updated = await usersRepository.update(id, input);

    if (env.MONGODB_ENABLED) {
      await userActivityRepository.log({
        userId: id,
        action: 'profile_updated',
        metadata: { fields: Object.keys(input) },
      });
    }

    return updated;
  }

  async getActivity(userId: string, requesterId: string, requesterRole: string) {
    if (requesterRole !== 'ADMIN' && requesterId !== userId) {
      throw new ForbiddenError('You can only view your own activity');
    }

    if (!env.MONGODB_ENABLED) {
      return [];
    }

    return userActivityRepository.findByUserId(userId);
  }
}

export const usersService = new UsersService();
