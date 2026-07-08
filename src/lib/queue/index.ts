import { closeEmailQueue, startEmailQueueWorker } from './email.queue.js';
import { logger } from '@/lib/logger.js';

export { addEmailJob, getEmailQueue } from './email.queue.js';
export type { EmailJobData } from './email.queue.js';

export async function startQueueWorkers(): Promise<void> {
  try {
    await startEmailQueueWorker();
  } catch (err) {
    logger.warn({ err }, 'Queue workers failed to start — continuing in degraded mode');
  }
}

export async function closeQueues(): Promise<void> {
  await closeEmailQueue();
}
