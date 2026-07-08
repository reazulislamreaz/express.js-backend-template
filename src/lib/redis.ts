import { Redis } from 'ioredis';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

let redis: Redis | null = null;
let redisConnected = false;

export function isRedisConnected(): boolean {
  return redisConnected && redis !== null;
}

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

  try {
    const client = getRedis();
    if (client.status === 'end' || client.status === 'close') {
      redis = null;
      redisConnected = false;
    }

    const activeClient = getRedis();
    if (activeClient.status === 'wait') {
      await activeClient.connect();
    }

    await activeClient.ping();
    redisConnected = true;
    logger.info('Redis connected');
  } catch (err) {
    redisConnected = false;
    redis = null;
    logger.warn({ err }, 'Redis connection failed — continuing in degraded mode');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!redis) return;

  const client = redis;
  redis = null;
  redisConnected = false;
  await client.quit();
  logger.info('Redis disconnected');
}
