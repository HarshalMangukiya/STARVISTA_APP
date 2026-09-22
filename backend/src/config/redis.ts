import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('⚠️ Redis connection failed. Running without Redis cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn(`⚠️ Redis error: ${err.message}`);
    });
  } catch (error) {
    logger.warn('⚠️ Redis initialization error, continuing without Redis');
  }
} else {
  logger.info('ℹ️  REDIS_URL not configured. Running with in-memory caching fallback.');
}

export const connectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.connect();
    } catch (err: any) {
      logger.warn(`⚠️ Could not connect to Redis at startup: ${err?.message || err}. Continuing.`);
    }
  }
};

export const getRedisClient = (): Redis | null => redisClient;
export const checkRedisHealth = (): boolean => isRedisAvailable;
