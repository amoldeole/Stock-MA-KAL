// ============================================================
// Server Configuration
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stockmakal',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: '7d',
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },

  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  },

  stockApi: {
    alphaVantage: process.env.ALPHA_VANTAGE_KEY || '',
    finnhub: process.env.FINNHUB_KEY || '',
    polygon: process.env.POLYGON_API_KEY || '',
    twelveData: process.env.TWELVE_DATA_KEY || '',
  },

  ws: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@stockmakal.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
} as const;
