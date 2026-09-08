// ============================================================
// Auth Routes (JWT)
// ============================================================

import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { db } from '../services/database';
import { logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createJWT(payload: Record<string, unknown>): string {
  // Simple JWT for demo (use jsonwebtoken in production)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 3600 * 1000 })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', config.jwt.secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    // Check admin
    if (email === config.admin.email && password === config.admin.password) {
      const token = createJWT({ email, role: 'admin', userId: 'admin-1' });
      return { success: true, data: { token, user: { email, role: 'admin', name: 'Admin' } } };
    }

    // Check DB users
    const user = await db.queryOne<any>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user && user.password_hash === hashPassword(password)) {
      const token = createJWT({ email, role: user.role, userId: user.id });
      return { success: true, data: { token, user: { email, role: user.role, name: user.name } } };
    }

    return reply.status(401).send({ success: false, error: 'Invalid credentials' });
  });

  app.post('/register', async (request, reply) => {
    const { email, password, name } = request.body as {
      email: string;
      password: string;
      name: string;
    };

    try {
      const id = uuid();
      await db.query(
        'INSERT INTO users (id, email, name, password_hash, role, plan) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, email, name, hashPassword(password), 'user', 'free']
      );

      const token = createJWT({ email, role: 'user', userId: id });
      return { success: true, data: { token, user: { email, role: 'user', name } } };
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.status(409).send({ success: false, error: 'Email already exists' });
      }
      logger.error({ err }, 'Registration failed');
      return reply.status(500).send({ success: false, error: 'Registration failed' });
    }
  });

  app.get('/me', async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, error: 'No token' });
    }

    try {
      const token = auth.slice(7);
      const [, body] = token.split('.');
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());

      if (payload.exp < Date.now()) {
        return reply.status(401).send({ success: false, error: 'Token expired' });
      }

      return { success: true, data: payload };
    } catch {
      return reply.status(401).send({ success: false, error: 'Invalid token' });
    }
  });
}
