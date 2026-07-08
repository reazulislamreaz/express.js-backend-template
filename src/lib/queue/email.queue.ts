import { JobsOptions, Queue, QueueEvents, Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import type { Job } from 'bullmq';
import { env } from '@/config/env.js';
import { isRedisConnected } from '@/lib/redis.js';
import { logger } from '@/lib/logger.js';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  payload?: Record<string, unknown>;
}

const EMAIL_QUEUE_NAME = 'email';
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
};

type EmailQueue = Queue<EmailJobData, unknown, 'send'>;
type EmailWorker = Worker<EmailJobData, unknown, 'send'>;
type EmailJob = Job<EmailJobData, unknown, 'send'>;

let emailQueue: EmailQueue | null = null;
let emailQueueEvents: QueueEvents | null = null;
let emailWorker: EmailWorker | null = null;

function getQueueConnection(): ConnectionOptions {
  return {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
  };
}

export function getEmailQueue(): EmailQueue {
  if (!env.REDIS_ENABLED) {
    throw new Error('Email queue is unavailable because Redis is disabled');
  }

  if (!emailQueue) {
    emailQueue = new Queue<EmailJobData, unknown, 'send'>(EMAIL_QUEUE_NAME, {
      connection: getQueueConnection(),
      prefix: env.QUEUE_PREFIX,
      defaultJobOptions,
    });
  }

  return emailQueue;
}

export async function addEmailJob(data: EmailJobData, options?: JobsOptions) {
  return getEmailQueue().add('send', data, {
    ...options,
    jobId: options?.jobId,
  });
}

export async function startEmailQueueWorker(): Promise<void> {
  if (!env.REDIS_ENABLED || !env.QUEUE_WORKERS_ENABLED) {
    logger.info('Email queue worker disabled');
    return;
  }

  if (!isRedisConnected()) {
    logger.warn('Email queue worker skipped — Redis is not connected');
    return;
  }

  if (emailWorker) return;

  emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
    connection: getQueueConnection(),
    prefix: env.QUEUE_PREFIX,
  });

  emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason, queue: EMAIL_QUEUE_NAME }, 'Queue job failed');
  });

  emailQueueEvents.on('error', (err) => {
    logger.error({ err, queue: EMAIL_QUEUE_NAME }, 'Queue events error');
  });

  emailWorker = new Worker<EmailJobData, unknown, 'send'>(
    EMAIL_QUEUE_NAME,
    async (job: EmailJob) => {
      logger.info(
        {
          jobId: job.id,
          queue: EMAIL_QUEUE_NAME,
          to: job.data.to,
          template: job.data.template,
        },
        'Processing email job',
      );

      // Replace this with your email provider integration.
      return { delivered: true };
    },
    {
      connection: getQueueConnection(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 5,
    },
  );

  emailWorker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: EMAIL_QUEUE_NAME }, 'Queue job completed');
  });

  emailWorker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, queue: EMAIL_QUEUE_NAME }, 'Queue worker failed job');
  });

  emailWorker.on('error', (err) => {
    logger.error({ err, queue: EMAIL_QUEUE_NAME }, 'Queue worker error');
  });

  await emailQueueEvents.waitUntilReady();
  await emailWorker.waitUntilReady();
  logger.info({ queue: EMAIL_QUEUE_NAME }, 'Email queue worker started');
}

export async function closeEmailQueue(): Promise<void> {
  await Promise.all([emailWorker?.close(), emailQueueEvents?.close(), emailQueue?.close()]);

  emailWorker = null;
  emailQueueEvents = null;
  emailQueue = null;
}
