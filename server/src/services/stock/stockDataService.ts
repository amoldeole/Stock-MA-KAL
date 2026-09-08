// ============================================================
// Stock Data Service
// Multi-provider with fallback + Redis caching
// ============================================================

import axios from 'axios';
import { config } from '../../config';
import { redisClient } from '../redis';
import { logger } from '../../utils/logger';
import { OHLCV, StockQuote, TimeFrame } from '@stock-ma-kal/shared';

const CACHE_TTL = {
  quote: 5,        // 5 seconds
  history: 300,    // 5 minutes
  search: 3600,    // 1 hour
};

export class StockDataService {
  // ─── Real-time Quote ────────────────────────────────────────

  async getQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `quote:${symbol}`;
    const cached = await redisClient.get<StockQuote>(cacheKey);
    if (cached) return cached;

    // Try providers in order
    const quote =
      (await this.getQuoteFromFinnhub(symbol)) ||
      (await this.getQuoteFromAlphaVantage(symbol)) ||
      (await this.generateMockQuote(symbol));

    if (quote) {
      await redisClient.set(cacheKey, quote, CACHE_TTL.quote);
    }

    return quote;
  }

  // ─── Historical Data ────────────────────────────────────────

  async getHistory(
    symbol: string,
    timeframe: TimeFrame,
    limit: number = 500
  ): Promise<OHLCV[]> {
    const cacheKey = `history:${symbol}:${timeframe}:${limit}`;
    const cached = await redisClient.get<OHLCV[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    const history =
      (await this.getHistoryFromAlphaVantage(symbol, timeframe, limit)) ||
      (await this.generateMockHistory(symbol, timeframe, limit));

    if (history && history.length > 0) {
      await redisClient.set(cacheKey, history, CACHE_TTL.history);
    }

    return history;
  }

  // ─── Search Stocks ──────────────────────────────────────────

  async search(query: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = await redisClient.get<any[]>(cacheKey);
    if (cached) return cached;

    const results = await this.searchFinnhub(query);
    if (results.length > 0) {
      await redisClient.set(cacheKey, results, CACHE_TTL.search);
    }

    return results;
  }

  // ─── Finnhub Provider ───────────────────────────────────────

  private async getQuoteFromFinnhub(symbol: string): Promise<StockQuote | null> {
    if (!config.stockApi.finnhub || config.stockApi.finnhub === 'demo') return null;

    try {
      const { data } = await axios.get('https://finnhub.io/api/v1/quote', {
        params: { symbol, token: config.stockApi.finnhub },
        timeout: 5000,
      });

      if (data.c === 0) return null;

      return {
        symbol,
        name: symbol,
        exchange: 'US',
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        volume: 0,
        marketCap: 0,
        timestamp: Date.now(),
      };
    } catch (err) {
      logger.debug({ err, symbol }, 'Finnhub quote failed');
      return null;
    }
  }

  private async searchFinnhub(query: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
    if (!config.stockApi.finnhub || config.stockApi.finnhub === 'demo') {
      return this.mockSearch(query);
    }

    try {
      const { data } = await axios.get('https://finnhub.io/api/v1/search', {
        params: { q: query, token: config.stockApi.finnhub },
        timeout: 5000,
      });

      return (data.result || []).slice(0, 10).map((r: any) => ({
        symbol: r.symbol,
        name: r.description,
        exchange: r.exchange || 'US',
      }));
    } catch {
      return this.mockSearch(query);
    }
  }

  // ─── Alpha Vantage Provider ─────────────────────────────────

  private async getQuoteFromAlphaVantage(symbol: string): Promise<StockQuote | null> {
    if (!config.stockApi.alphaVantage || config.stockApi.alphaVantage === 'demo') return null;

    try {
      const { data } = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: config.stockApi.alphaVantage,
        },
        timeout: 5000,
      });

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) return null;

      return {
        symbol,
        name: symbol,
        exchange: 'US',
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']),
        volume: parseInt(quote['06. volume']),
        marketCap: 0,
        timestamp: Date.now(),
      };
    } catch (err) {
      logger.debug({ err, symbol }, 'AlphaVantage quote failed');
      return null;
    }
  }

  private async getHistoryFromAlphaVantage(
    symbol: string,
    timeframe: TimeFrame,
    limit: number
  ): Promise<OHLCV[]> {
    if (!config.stockApi.alphaVantage || config.stockApi.alphaVantage === 'demo') return [];

    const functionMap: Record<string, string> = {
      '1m': 'TIME_SERIES_INTRADAY',
      '5m': 'TIME_SERIES_INTRADAY',
      '15m': 'TIME_SERIES_INTRADAY',
      '30m': 'TIME_SERIES_INTRADAY',
      '1h': 'TIME_SERIES_INTRADAY',
      '1d': 'TIME_SERIES_DAILY',
      '1w': 'TIME_SERIES_WEEKLY',
      '1M': 'TIME_SERIES_MONTHLY',
    };

    try {
      const params: Record<string, string> = {
        function: functionMap[timeframe] || 'TIME_SERIES_DAILY',
        symbol,
        apikey: config.stockApi.alphaVantage,
      };

      if (['1m', '5m', '15m', '30m', '1h'].includes(timeframe)) {
        params.interval = timeframe;
      }

      const { data } = await axios.get('https://www.alphavantage.co/query', {
        params,
        timeout: 10000,
      });

      const timeSeries =
        data['Time Series (Daily)'] ||
        data['Weekly Time Series'] ||
        data['Monthly Time Series'] ||
        data[`Time Series (${timeframe})`];

      if (!timeSeries) return [];

      const entries = Object.entries(timeSeries).slice(0, limit);

      return entries
        .map(([dateStr, values]: [string, any]) => ({
          timestamp: new Date(dateStr).getTime(),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        }))
        .reverse();
    } catch (err) {
      logger.debug({ err, symbol }, 'AlphaVantage history failed');
      return [];
    }
  }

  // ─── Mock Data (Development/Demo) ──────────────────────────

  private async generateMockQuote(symbol: string): Promise<StockQuote> {
    const basePrice = this.getBasePrice(symbol);
    const change = (Math.random() - 0.48) * basePrice * 0.02;
    const price = basePrice + change;

    return {
      symbol,
      name: this.getCompanyName(symbol),
      exchange: 'US',
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      marketCap: Math.floor(price * (Math.random() * 5e9 + 1e9)),
      timestamp: Date.now(),
    };
  }

  private async generateMockHistory(
    symbol: string,
    timeframe: TimeFrame,
    limit: number
  ): Promise<OHLCV[]> {
    const basePrice = this.getBasePrice(symbol);
    const data: OHLCV[] = [];
    let price = basePrice * 0.85; // Start 15% below current

    const intervalMs = this.timeframeToMs(timeframe);
    const now = Date.now();
    const startTime = now - limit * intervalMs;

    // Generate realistic price action with trends and mean reversion
    let trend = (Math.random() - 0.5) * 0.001;
    let volatility = basePrice * 0.015;

    for (let i = 0; i < limit; i++) {
      // Random walk with drift
      if (Math.random() < 0.05) trend = (Math.random() - 0.5) * 0.002; // Trend change
      if (Math.random() < 0.02) volatility *= 1 + (Math.random() - 0.5) * 0.5; // Vol change

      const drift = trend * price;
      const noise = (Math.random() - 0.5) * 2 * volatility;
      price = Math.max(price + drift + noise, price * 0.95); // Floor at 95%

      const high = price + Math.random() * volatility * 0.5;
      const low = price - Math.random() * volatility * 0.5;
      const open = low + Math.random() * (high - low);
      const close = low + Math.random() * (high - low);

      data.push({
        timestamp: startTime + i * intervalMs,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 30000000) + 5000000,
      });
    }

    return data;
  }

  private mockSearch(query: string): { symbol: string; name: string; exchange: string }[] {
    const stocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
      { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
      { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ' },
      { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
      { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
      { symbol: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE' },
      { symbol: 'BAC', name: 'Bank of America', exchange: 'NYSE' },
      { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
      { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
    ];

    const q = query.toUpperCase();
    return stocks.filter(
      (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
    );
  }

  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      AAPL: 195, MSFT: 425, GOOGL: 175, AMZN: 185, TSLA: 250,
      NVDA: 880, META: 510, SPY: 525, QQQ: 445, AMD: 175,
      NFLX: 630, JPM: 200, BAC: 38, V: 280, WMT: 170,
    };
    return prices[symbol] || 50 + Math.random() * 200;
  }

  private getCompanyName(symbol: string): string {
    const names: Record<string, string> = {
      AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com Inc.', TSLA: 'Tesla Inc.', NVDA: 'NVIDIA Corp.',
      META: 'Meta Platforms', SPY: 'SPDR S&P 500', QQQ: 'Invesco QQQ',
    };
    return names[symbol] || symbol;
  }

  private timeframeToMs(tf: TimeFrame): number {
    const map: Record<TimeFrame, number> = {
      '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000,
      '1h': 3600000, '4h': 14400000, '1d': 86400000, '1w': 604800000,
      '1M': 2592000000,
    };
    return map[tf];
  }
}

export const stockService = new StockDataService();
