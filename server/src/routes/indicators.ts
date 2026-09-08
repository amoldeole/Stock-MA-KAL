// ============================================================
// Indicator Routes
// Calculate indicators server-side
// ============================================================

import { FastifyInstance } from 'fastify';
import { stockService } from '../services/stock/stockDataService';
import {
  calculateMA,
  extractField,
  kalmanFilter,
  adaptiveKalmanFilter,
  generateSignal,
  rsi,
  MAConfig,
  KalmanFilterConfig,
  TimeFrame,
  SignalConfig,
} from '@stock-ma-kal/shared';

export async function indicatorRoutes(app: FastifyInstance) {
  // Calculate MA for a symbol
  app.post('/indicators/ma', async (request) => {
    const { symbol, timeframe, config: maConfig } = request.body as {
      symbol: string;
      timeframe?: TimeFrame;
      config: MAConfig;
    };

    const history = await stockService.getHistory(
      symbol.toUpperCase(),
      timeframe || '1d',
      500
    );

    const field = maConfig.field || 'close';
    const prices = extractField(history, field);
    const values = calculateMA(prices, maConfig);

    const offset = prices.length - values.length;
    const result = values.map((v, i) => ({
      timestamp: history[i + offset].timestamp,
      value: Math.round(v * 100) / 100,
    }));

    return {
      success: true,
      data: {
        name: `${maConfig.type}(${maConfig.period})`,
        values: result,
        config: maConfig,
      },
    };
  });

  // Calculate Kalman Filter
  app.post('/indicators/kalman', async (request) => {
    const { symbol, timeframe, config: kfConfig } = request.body as {
      symbol: string;
      timeframe?: TimeFrame;
      config?: Partial<KalmanFilterConfig>;
    };

    const history = await stockService.getHistory(
      symbol.toUpperCase(),
      timeframe || '1d',
      500
    );

    const prices = extractField(history, 'close');
    const result = kfConfig?.processNoise
      ? kalmanFilter(prices, kfConfig)
      : adaptiveKalmanFilter(prices);

    const offset = prices.length - result.estimates.length;

    return {
      success: true,
      data: {
        estimates: result.estimates.map((v, i) => ({
          timestamp: history[i + offset].timestamp,
          value: Math.round(v * 100) / 100,
        })),
        velocities: result.velocities.map((v, i) => ({
          timestamp: history[i + offset].timestamp,
          value: Math.round(v * 10000) / 10000,
        })),
        states: result.states.slice(-50), // Last 50 states
      },
    };
  });

  // Generate trading signal
  app.post('/signals/generate', async (request) => {
    const { symbol, timeframe, signalConfig } = request.body as {
      symbol: string;
      timeframe?: TimeFrame;
      signalConfig?: Partial<SignalConfig>;
    };

    const history = await stockService.getHistory(
      symbol.toUpperCase(),
      timeframe || '1d',
      200
    );

    const config: SignalConfig = {
      fastMA: signalConfig?.fastMA || { type: 'EMA', period: 12 },
      slowMA: signalConfig?.slowMA || { type: 'EMA', period: 26 },
      kalman: signalConfig?.kalman || {
        processNoise: 0.01,
        measurementNoise: 1.0,
        estimateError: 1.0,
      },
      rsiPeriod: signalConfig?.rsiPeriod || 14,
    };

    const signal = generateSignal(history, config);

    return {
      success: true,
      data: signal,
    };
  });

  // Calculate RSI
  app.post('/indicators/rsi', async (request) => {
    const { symbol, timeframe, period } = request.body as {
      symbol: string;
      timeframe?: TimeFrame;
      period?: number;
    };

    const history = await stockService.getHistory(
      symbol.toUpperCase(),
      timeframe || '1d',
      500
    );

    const prices = extractField(history, 'close');
    const values = rsi(prices, period || 14);
    const offset = prices.length - values.length;

    return {
      success: true,
      data: {
        name: `RSI(${period || 14})`,
        values: values.map((v, i) => ({
          timestamp: history[i + offset].timestamp,
          value: Math.round(v * 100) / 100,
        })),
      },
    };
  });
}
