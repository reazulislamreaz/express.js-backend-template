import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/database/index.js';
import { env } from '@/config/env.js';
import { getMongoDb, getRedis } from '@/lib/database/index.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = 'ok';
  } catch {
    checks.postgres = 'error';
  }

  if (env.MONGODB_ENABLED) {
    try {
      const db = getMongoDb();
      await db.command({ ping: 1 });
      checks.mongodb = 'ok';
    } catch {
      checks.mongodb = 'error';
    }
  }

  if (env.REDIS_ENABLED) {
    try {
      const redis = getRedis();
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }
  }

  const allHealthy = Object.values(checks).every((v) => v === 'ok');
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: allHealthy,
    data: {
      status: allHealthy ? 'ready' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
