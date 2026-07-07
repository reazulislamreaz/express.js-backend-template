import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/database/index.js';
import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

export interface UserActivity {
  _id?: ObjectId;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const COLLECTION = 'user_activities';

export class UserActivityRepository {
  private get collection() {
    if (!env.MONGODB_ENABLED) {
      throw new Error('MongoDB is not enabled');
    }
    return getCollection<UserActivity>(COLLECTION);
  }

  async log(activity: Omit<UserActivity, '_id' | 'createdAt'>): Promise<void> {
    try {
      await this.collection.insertOne({
        ...activity,
        createdAt: new Date(),
      });
    } catch (err) {
      logger.warn({ err, activity }, 'Failed to log user activity to MongoDB');
    }
  }

  async findByUserId(userId: string, limit = 50): Promise<UserActivity[]> {
    return this.collection.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  }
}

export const userActivityRepository = new UserActivityRepository();
