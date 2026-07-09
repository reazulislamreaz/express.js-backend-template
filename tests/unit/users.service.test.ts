import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceUnavailableError } from '@/shared/errors/index.js';

vi.mock('@/config/env.js', () => ({
  env: { MONGODB_ENABLED: true },
}));

vi.mock('@/lib/database/index.js', () => ({
  isMongoConnected: vi.fn(),
}));

vi.mock('@/modules/users/users.repository.js', () => ({
  usersRepository: {
    exists: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/modules/users/users.activity.repository.js', () => ({
  userActivityRepository: {
    findByUserId: vi.fn(),
  },
}));

vi.mock('@/modules/auth/auth.repository.js', () => ({
  authRepository: {},
}));

import { isMongoConnected } from '@/lib/database/index.js';
import { usersService } from '@/modules/users/users.service.js';

describe('UsersService', () => {
  beforeEach(() => {
    vi.mocked(isMongoConnected).mockReset();
  });

  it('throws when activity log is enabled but MongoDB is unavailable', async () => {
    vi.mocked(isMongoConnected).mockReturnValue(false);

    await expect(usersService.getActivity('user-id', 'user-id', 'USER')).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
  });
});
