// ============================================================
// Logger (Pino-based)
// ============================================================

import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.env === 'development' ? 'debug' : 'info',
  transport:
    config.env === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
  base: { service: 'stock-ma-kal-api' },
});
