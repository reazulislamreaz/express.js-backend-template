import { connectPostgres, disconnectPostgres } from './postgres.js';
import { connectMongo, disconnectMongo } from './mongodb.js';

export { prisma } from './postgres.js';
export { getMongoDb, getCollection } from './mongodb.js';

export async function connectDatabases(): Promise<void> {
  await connectPostgres();
  await connectMongo();
}

export async function disconnectDatabases(): Promise<void> {
  await Promise.all([disconnectPostgres(), disconnectMongo()]);
}
