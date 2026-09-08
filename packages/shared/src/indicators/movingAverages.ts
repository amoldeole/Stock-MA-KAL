// ============================================================
// Moving Average Implementations
// SMA, EMA, WMA, DEMA, TEMA, HMA, KAMA
// Optimized for real-time streaming data
// ============================================================

import { MAConfig, MAType, OHLCV } from '../types';

// ─── Simple Moving Average (SMA) ────────────────────────────
export function sma(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const result: number[] = [];
  let sum = 0;

  // Initial window
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result.push(sum / period);

  // Sliding window - O(n) complexity
  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result.push(sum / period);
  }

  return result;
}

// ─── Exponential Moving Average (EMA) ───────────────────────
export function ema(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prev = sum / period;
  result.push(prev);

  // EMA calculation
  for (let i = period; i < data.length; i++) {
    const value = (data[i] - prev) * multiplier + prev;
    result.push(value);
    prev = value;
  }

  return result;
}

// ─── Weighted Moving Average (WMA) ──────────────────────────
export function wma(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const result: number[] = [];
  const weightSum = (period * (period + 1)) / 2;

  for (let i = period - 1; i < data.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += data[i - period + 1 + j] * (j + 1);
    }
    result.push(weightedSum / weightSum);
  }

  return result;
}

// ─── Double EMA (DEMA) ──────────────────────────────────────
export function dema(data: number[], period: number): number[] {
  const ema1 = ema(data, period);
  const ema2 = ema(ema1, period);

  if (ema1.length !== ema2.length) {
    const offset = ema1.length - ema2.length;
    return ema2.map((val, i) => 2 * ema1[i + offset] - val);
  }

  return ema1.map((val, i) => 2 * val - ema2[i]);
}

// ─── Triple EMA (TEMA) ──────────────────────────────────────
export function tema(data: number[], period: number): number[] {
  const ema1 = ema(data, period);
  const ema2 = ema(ema1, period);
  const ema3 = ema(ema2, period);

  const len = ema3.length;
  const offset1 = ema1.length - len;
  const offset2 = ema2.length - len;

  return ema3.map((val, i) => 
    3 * ema1[i + offset1] - 3 * ema2[i + offset2] + val
  );
}

// ─── Hull Moving Average (HMA) ──────────────────────────────
// Reduced lag, improved smoothing - excellent for trend following
export function hma(data: number[], period: number): number[] {
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.floor(Math.sqrt(period));

  const wma1 = wma(data, halfPeriod);
  const wma2 = wma(data, period);

  // Diff series: 2 * WMA(n/2) - WMA(n)
  const offset = wma1.length - wma2.length;
  const diff: number[] = [];
  for (let i = 0; i < wma2.length; i++) {
    diff.push(2 * wma1[i + offset] - wma2[i]);
  }

  return wma(diff, sqrtPeriod);
}

// ─── Kaufman Adaptive Moving Average (KAMA) ─────────────────
// Self-adjusting based on market volatility
export function kama(data: number[], period: number, fastPeriod = 2, slowPeriod = 30): number[] {
  if (data.length < period + 1) return [];

  const fastSC = 2 / (fastPeriod + 1);
  const slowSC = 2 / (slowPeriod + 1);
  const result: number[] = [];

  let prevKAMA = data[period];
  result.push(prevKAMA);

  for (let i = period + 1; i < data.length; i++) {
    // Direction: |price - price[period]|
    const direction = Math.abs(data[i] - data[i - period]);

    // Volatility: sum of |price[i] - price[i-1]| over period
    let volatility = 0;
    for (let j = 0; j < period; j++) {
      volatility += Math.abs(data[i - j] - data[i - j - 1]);
    }

    // Efficiency Ratio
    const er = volatility !== 0 ? direction / volatility : 0;

    // Smoothing Constant
    const sc = Math.pow(er * (fastSC - slowSC) + slowSC, 2);

    // KAMA
    const kama = prevKAMA + sc * (data[i] - prevKAMA);
    result.push(kama);
    prevKAMA = kama;
  }

  return result;
}

// ─── Unified MA Calculator ──────────────────────────────────
export function calculateMA(data: number[], config: MAConfig): number[] {
  switch (config.type) {
    case 'SMA': return sma(data, config.period);
    case 'EMA': return ema(data, config.period);
    case 'WMA': return wma(data, config.period);
    case 'DEMA': return dema(data, config.period);
    case 'TEMA': return tema(data, config.period);
    case 'HMA': return hma(data, config.period);
    case 'KAMA': return kama(data, config.period);
    default: return sma(data, config.period);
  }
}

// ─── Extract price field from OHLCV ─────────────────────────
export function extractField(data: OHLCV[], field: 'open' | 'high' | 'low' | 'close' = 'close'): number[] {
  return data.map((d) => d[field]);
}

// ─── MA Crossover Detection ─────────────────────────────────
export function detectCrossover(
  fast: number[],
  slow: number[]
): { type: 'golden_cross' | 'death_cross'; index: number }[] {
  const signals: { type: 'golden_cross' | 'death_cross'; index: number }[] = [];
  const offset = fast.length - slow.length;

  for (let i = 1; i < slow.length; i++) {
    const prevDiff = fast[i - 1 + offset] - slow[i - 1];
    const currDiff = fast[i + offset] - slow[i];

    if (prevDiff <= 0 && currDiff > 0) {
      signals.push({ type: 'golden_cross', index: i });
    } else if (prevDiff >= 0 && currDiff < 0) {
      signals.push({ type: 'death_cross', index: i });
    }
  }

  return signals;
}
