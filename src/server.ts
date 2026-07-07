import 'dotenv/config';
import { createApp } from './app.js';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';
import { connectDatabases, disconnectDatabases } from '@/lib/database/index.js';
import { closeQueues, startQueueWorkers } from '@/lib/queue/index.js';

async function bootstrap() {
  await connectDatabases();
  await startQueueWorkers();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV, prefix: env.API_PREFIX }, 'Server started');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await closeQueues();
      await disconnectDatabases();
      logger.info('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  Promise.allSettled([closeQueues(), disconnectDatabases()]).finally(() => {
    process.exit(1);
  });
});
