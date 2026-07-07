import { Redis } from 'ioredis';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!env.REDIS_ENABLED) {
    throw new Error('Redis is not enabled');
  }

  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    redis.on('error', (err: Error) => {
      logger.error({ err }, 'Redis client error');
    });

    redis.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });
  }

  return redis;
}

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_ENABLED) {
    logger.info('Redis disabled via REDIS_ENABLED=false');
    return;
  }

  const client = getRedis();
  if (client.status === 'end' || client.status === 'close') {
    redis = null;
  }

  const activeClient = getRedis();
  if (activeClient.status === 'wait') {
    await activeClient.connect();
  }

  await activeClient.ping();
  logger.info('Redis connected');
}

export async function disconnectRedis(): Promise<void> {
  if (!redis) return;

  const client = redis;
  redis = null;
  await client.quit();
  logger.info('Redis disconnected');
}
