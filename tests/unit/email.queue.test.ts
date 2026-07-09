import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock('@/config/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env.js')>();
  return {
    ...actual,
    env: {
      ...actual.env,
      REDIS_ENABLED: true,
    },
  };
});

vi.mock('@/lib/redis.js', () => ({
  isRedisConnected: vi.fn(),
}));

import { isRedisConnected } from '@/lib/redis.js';
import { getEmailQueue } from '@/lib/queue/email.queue.js';

describe('Email queue', () => {
  beforeEach(() => {
    vi.mocked(isRedisConnected).mockReset();
  });

  it('throws when Redis is enabled but not connected', () => {
    vi.mocked(isRedisConnected).mockReturnValue(false);

    expect(() => getEmailQueue()).toThrow(
      'Email queue is unavailable because Redis is not connected',
    );
  });
});
