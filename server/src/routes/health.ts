// ============================================================
// Health Check Route
// ============================================================

import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    success: true,
    data: {
      status: 'ok',
      timestamp: Date.now(),
      version: '1.0.0',
      uptime: process.uptime(),
    },
  }));
}
