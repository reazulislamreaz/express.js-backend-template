import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';
import { authRepository } from '@/modules/auth/auth.repository.js';

let cleanupTimer: NodeJS.Timeout | null = null;

async function runTokenCleanup(): Promise<void> {
  try {
    const deleted = await authRepository.cleanupExpiredRefreshTokens(
      env.TOKEN_CLEANUP_REVOKED_RETENTION_DAYS,
    );
    if (deleted > 0) {
      logger.info({ deleted }, 'Expired refresh tokens cleaned up');
    }
  } catch (err) {
    logger.error({ err }, 'Refresh token cleanup failed');
  }
}

export async function startTokenCleanupScheduler(): Promise<void> {
  await runTokenCleanup();

  cleanupTimer = setInterval(runTokenCleanup, env.TOKEN_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();

  logger.info(
    { intervalMs: env.TOKEN_CLEANUP_INTERVAL_MS },
    'Refresh token cleanup scheduler started',
  );
}

export async function stopTokenCleanupScheduler(): Promise<void> {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
