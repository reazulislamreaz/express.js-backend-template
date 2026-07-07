import { MongoClient, Db, Collection, Document } from 'mongodb';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db | null> {
  if (!env.MONGODB_ENABLED) {
    logger.info('MongoDB disabled via MONGODB_ENABLED=false');
    return null;
  }

  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db();

  await db.command({ ping: 1 });
  await db.collection('user_activities').createIndex({ userId: 1, createdAt: -1 });
  logger.info('MongoDB connected');

  return db;
}

export function getMongoDb(): Db {
  if (!db) {
    throw new Error('MongoDB is not connected. Call connectMongo() first.');
  }
  return db;
}

export function getCollection<T extends Document = Document>(name: string): Collection<T> {
  return getMongoDb().collection<T>(name);
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB disconnected');
  }
}
