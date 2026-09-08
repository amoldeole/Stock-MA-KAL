// ============================================================
// Stock-MA-KAL API Server Entry Point
// Fastify + WebSocket + Redis caching
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { stockRoutes } from './routes/stock';
import { indicatorRoutes } from './routes/indicators';
import { featuresRoutes } from './routes/features';
import { adminRoutes } from './routes/admin';
import { voiceRoutes } from './routes/voice';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { setupWebSocket } from './routes/websocket';
import { redisClient } from './services/redis';
import { db } from './services/database';

async function main() {
  const app = Fastify({
    logger: false, // We use our own pino logger
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // ─── Plugins ────────────────────────────────────────────────

  await app.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    keyGenerator: (req) => req.ip,
  });

  await app.register(websocket);

  // ─── Routes ─────────────────────────────────────────────────

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(stockRoutes, { prefix: '/api' });
  await app.register(indicatorRoutes, { prefix: '/api' });
  await app.register(featuresRoutes, { prefix: '/api' });
  await app.register(voiceRoutes, { prefix: '/api/voice' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

  // WebSocket
  app.register(async (instance) => {
    instance.get('/ws', { websocket: true }, setupWebSocket);
  });

  // ─── Error Handler ──────────────────────────────────────────

  app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error, url: request.url, method: request.method }, 'Request error');

    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      success: false,
      error: config.env === 'production' ? 'Internal server error' : error.message,
    });
  });

  // ─── Start ──────────────────────────────────────────────────

  try {
    // Connect to services
    await redisClient.connect();
    await db.connect();
    logger.info('✅ Connected to Redis and PostgreSQL');

    const address = await app.listen({ port: config.port, host: config.host });
    logger.info(`🚀 Stock-MA-KAL API running at ${address}`);
    logger.info(`📡 WebSocket available at ws://${config.host}:${config.port}/ws`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }

  // ─── Graceful Shutdown ──────────────────────────────────────

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    await app.close();
    await redisClient.disconnect();
    await db.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
