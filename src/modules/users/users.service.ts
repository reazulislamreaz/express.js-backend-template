import { NotFoundError, ForbiddenError, ServiceUnavailableError } from '@/shared/errors/index.js';
import { env } from '@/config/env.js';
import { usersRepository } from './users.repository.js';
import { userActivityRepository } from './users.activity.repository.js';
import { isMongoConnected } from '@/lib/database/index.js';
import { authRepository } from '@/modules/auth/auth.repository.js';
import type { PaginationInput, UpdateUserInput } from './users.validation.js';

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

    return user;
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

    if (isMongoConnected()) {
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

    const userExists = await usersRepository.exists(userId);
    if (!userExists) {
      throw new NotFoundError('User');
    }

    if (env.MONGODB_ENABLED && !isMongoConnected()) {
      throw new ServiceUnavailableError('Activity log is temporarily unavailable');
    }

    if (!isMongoConnected()) {
      return [];
    }

    return userActivityRepository.findByUserId(userId);
  }

  async deactivate(id: string, requesterId: string, requesterRole: string) {
    if (requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Only administrators can deactivate users');
    }

    if (requesterId === id) {
      throw new ForbiddenError('You cannot deactivate your own account');
    }

    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.isActive) {
      return user;
    }

    const deactivated = await usersRepository.deactivate(id);
    await authRepository.revokeAllUserTokens(id);

    if (isMongoConnected()) {
      await userActivityRepository.log({
        userId: id,
        action: 'account_deactivated',
        metadata: { deactivatedBy: requesterId },
      });
    }

    return deactivated;
  }
}

export const usersService = new UsersService();
