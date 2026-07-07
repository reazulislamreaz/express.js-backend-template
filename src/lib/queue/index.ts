import { closeEmailQueue, startEmailQueueWorker } from './email.queue.js';

export { addEmailJob, getEmailQueue } from './email.queue.js';
export type { EmailJobData } from './email.queue.js';

export async function startQueueWorkers(): Promise<void> {
  await startEmailQueueWorker();
}

export async function closeQueues(): Promise<void> {
  await closeEmailQueue();
}
