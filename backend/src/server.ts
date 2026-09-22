import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await connectDatabase();

    // Connect to Redis (optional — gracefully handles unavailability)
    await connectRedis();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 STARVISTA API Server running on port ${env.PORT}`);
      logger.info(`📍 API Base: http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`❤️  Health Check: http://localhost:${env.PORT}/health`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        logger.info('All connections closed. Goodbye.');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
