import { MongoClient, Db, Collection, Document } from 'mongodb';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

let client: MongoClient | null = null;
let db: Db | null = null;
let mongoConnected = false;

export function isMongoConnected(): boolean {
  return mongoConnected && db !== null;
}

export async function connectMongo(): Promise<Db | null> {
  if (!env.MONGODB_ENABLED) {
    logger.info('MongoDB disabled via MONGODB_ENABLED=false');
    return null;
  }

  try {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    db = client.db();

    await db.command({ ping: 1 });
    await db.collection('user_activities').createIndex({ userId: 1, createdAt: -1 });
    mongoConnected = true;
    logger.info('MongoDB connected');

    return db;
  } catch (err) {
    mongoConnected = false;
    client = null;
    db = null;
    logger.warn({ err }, 'MongoDB connection failed — continuing in degraded mode');
    return null;
  }
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
    mongoConnected = false;
    logger.info('MongoDB disconnected');
  }
}
