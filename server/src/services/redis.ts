// ============================================================
// Redis Client - Caching Layer
// Sub-ms lookups for hot stock data
// ============================================================

import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

class RedisService {
  private client: Redis | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          return Math.min(times * 200, 5000);
        },
        lazyConnect: true,
      });

      this.client.on('error', (err) => logger.error({ err }, 'Redis error'));
      this.client.on('connect', () => logger.info('Redis connected'));

      await this.client.connect();
      this.connected = true;
    } catch (err) {
      logger.warn({ err }, 'Redis unavailable - running without cache');
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null;
    try {
      const val = await this.client.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      // Silently fail - cache is optional
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // ignore
    }
  }

  // Publish for WebSocket broadcasting
  async publish(channel: string, data: unknown): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      await this.client.publish(channel, JSON.stringify(data));
    } catch {
      // ignore
    }
  }
}

export const redisClient = new RedisService();
