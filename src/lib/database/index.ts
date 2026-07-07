import { connectPostgres, disconnectPostgres } from './postgres.js';
import { connectMongo, disconnectMongo } from './mongodb.js';
import { connectRedis, disconnectRedis } from '@/lib/redis.js';

export { prisma } from './postgres.js';
export { getMongoDb, getCollection } from './mongodb.js';
export { getRedis } from '@/lib/redis.js';

export async function connectDatabases(): Promise<void> {
  await connectPostgres();
  await connectMongo();
  await connectRedis();
}

export async function disconnectDatabases(): Promise<void> {
  await Promise.all([disconnectPostgres(), disconnectMongo(), disconnectRedis()]);
}
