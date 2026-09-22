import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, checkRedisHealth } from '../config/redis.js';
import { sendError } from '../utils/response.js';

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  const redis = getRedisClient();
  const isHealthy = checkRedisHealth();

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      sendError(
        res,
        options.message || 'Too many requests, please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    },
    store:
      redis && isHealthy
        ? new RedisStore({
            // @ts-ignore
            sendCommand: (...args: string[]) => redis.call(...args),
          })
        : undefined, // Memory store fallback
  });
};

// Rate limiter for authentication endpoints: 10 requests per 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

// General API rate limiter: 120 requests per minute
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'API rate limit exceeded. Please slow down your requests.',
});
