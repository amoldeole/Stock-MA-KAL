// ============================================================
// Stock Routes
// ============================================================

import { FastifyInstance } from 'fastify';
import { stockService } from '../services/stock/stockDataService';
import { TimeFrame } from '@stock-ma-kal/shared';

export async function stockRoutes(app: FastifyInstance) {
  // Get real-time quote
  app.get('/quote/:symbol', async (request, reply) => {
    const { symbol } = request.params as { symbol: string };
    const quote = await stockService.getQuote(symbol.toUpperCase());

    if (!quote) {
      return reply.status(404).send({ success: false, error: 'Symbol not found' });
    }

    return { success: true, data: quote };
  });

  // Get historical data
  app.get('/history/:symbol', async (request, reply) => {
    const { symbol } = request.params as { symbol: string };
    const { timeframe, limit } = request.query as {
      timeframe?: TimeFrame;
      limit?: string;
    };

    const tf = (timeframe || '1d') as TimeFrame;
    const lim = Math.min(parseInt(limit || '500', 10), 2000);

    const history = await stockService.getHistory(symbol.toUpperCase(), tf, lim);

    return {
      success: true,
      data: history,
      meta: { symbol: symbol.toUpperCase(), timeframe: tf, count: history.length, timestamp: Date.now() },
    };
  });

  // Search stocks
  app.get('/search', async (request) => {
    const { q } = request.query as { q?: string };
    if (!q || q.length < 1) {
      return { success: true, data: [] };
    }
    const results = await stockService.search(q);
    return { success: true, data: results };
  });

  // Batch quotes (for watchlist)
  app.post('/quotes', async (request) => {
    const { symbols } = request.body as { symbols: string[] };
    const quotes = await Promise.all(
      (symbols || []).map((s: string) => stockService.getQuote(s.toUpperCase()))
    );

    return {
      success: true,
      data: quotes.filter(Boolean),
    };
  });
}
