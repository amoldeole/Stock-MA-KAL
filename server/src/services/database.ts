// ============================================================
// Database Service (PostgreSQL)
// ============================================================

import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

class DatabaseService {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({ connectionString: config.database.url, max: 20 });
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('PostgreSQL connected');
    } catch (err) {
      logger.warn({ err }, 'PostgreSQL unavailable - running without persistence');
      this.pool = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async query<T = any>(text: string, params?: unknown[]): Promise<T[]> {
    if (!this.pool) return [];
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async queryOne<T = any>(text: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] || null;
  }
}

export const db = new DatabaseService();
