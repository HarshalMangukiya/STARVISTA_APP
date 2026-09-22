import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess, sendError } from './utils/response.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/database.js';
import { checkRedisHealth } from './config/redis.js';

// Route imports
import authRoutes from './routes/v1/authRoutes.js';
import propertyRoutes from './routes/v1/propertyRoutes.js';
import roomRoutes from './routes/v1/roomRoutes.js';
import residentRoutes from './routes/v1/residentRoutes.js';
import uploadRoutes from './routes/v1/uploadRoutes.js';

const app = express();

// ─── Security & Core Middleware ──────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing — increased limit for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Global rate limiter
app.use(apiRateLimiter);

// Request logging in development
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  try {
    // Check PostgreSQL connection
    await prisma.$queryRaw`SELECT 1`;
    const dbHealthy = true;
    const redisHealthy = checkRedisHealth();

    sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'not configured or unavailable',
      },
    });
  } catch (error: any) {
    sendError(res, 'Service unhealthy', 503, 'SERVICE_UNHEALTHY', {
      database: 'disconnected',
    });
  }
});

// ─── API Routes ──────────────────────────────────────────────────────────────

const prefix = env.API_PREFIX;

app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/properties`, propertyRoutes);
app.use(`${prefix}/properties/:propertyId/rooms`, roomRoutes);
app.use(`${prefix}/properties/:propertyId/rooms/:roomId/residents`, residentRoutes);
app.use(`${prefix}/upload`, uploadRoutes);

// ─── API Root Info ───────────────────────────────────────────────────────────

app.get(prefix, (_req, res) => {
  sendSuccess(res, {
    name: 'STARVISTA API',
    version: '1.0.0',
    description: 'Production REST API for STARVISTA Hostel Management System',
    docs: `${prefix}/docs`,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  sendError(res, 'Endpoint not found', 404, 'NOT_FOUND');
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(errorHandler);

export default app;
