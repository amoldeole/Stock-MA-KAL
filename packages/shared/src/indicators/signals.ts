// ============================================================
// Signal Generator
// Combines MA + Kalman for trading signals
// ============================================================

import { SignalResult, MAConfig, KalmanFilterConfig, OHLCV } from '../types';
import { calculateMA, extractField, detectCrossover } from './movingAverages';
import { kalmanFilter } from './kalmanFilter';

export interface SignalConfig {
  fastMA: MAConfig;
  slowMA: MAConfig;
  kalman?: KalmanFilterConfig;
  rsiPeriod?: number;
  volumeThreshold?: number;
}

/**
 * RSI calculation
 */
export function rsi(data: number[], period: number = 14): number[] {
  if (data.length < period + 1) return [];

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const result: number[] = [];

  // Initial average
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(100 - 100 / (1 + rs0));

  // Smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  return result;
}

/**
 * MACD calculation
 */
export function macd(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const { ema: emaCalc } = require('./movingAverages');

  const fastEMA = emaCalc(data, fastPeriod);
  const slowEMA = emaCalc(data, slowPeriod);

  const offset = fastEMA.length - slowEMA.length;
  const macdLine: number[] = slowEMA.map((val, i) => fastEMA[i + offset] - val);

  const signalLine = emaCalc(macdLine, signalPeriod);
  const sigOffset = macdLine.length - signalLine.length;
  const histogram = signalLine.map((val, i) => macdLine[i + sigOffset] - val);

  return { macdLine, signalLine, histogram };
}

/**
 * Generate composite trading signal
 */
export function generateSignal(
  data: OHLCV[],
  config: SignalConfig
): SignalResult {
  const closes = extractField(data, 'close');
  const volumes = extractField(data, 'volume');
  const timestamp = data[data.length - 1]?.timestamp ?? Date.now();

  let score = 0;
  const indicators: Record<string, number> = {};

  // 1. MA Crossover Signal
  const fastValues = calculateMA(closes, config.fastMA);
  const slowValues = calculateMA(closes, config.slowMA);
  const crossovers = detectCrossover(fastValues, slowValues);

  if (crossovers.length > 0) {
    const last = crossovers[crossovers.length - 1];
    const recency = (crossovers.length - 1 - crossovers.indexOf(last)) / crossovers.length;
    if (last.type === 'golden_cross') {
      score += 25 * (1 - recency * 0.5);
    } else {
      score -= 25 * (1 - recency * 0.5);
    }
    indicators.ma_crossover = last.type === 'golden_cross' ? 1 : -1;
  }

  // 2. MA Trend (price vs fast MA)
  if (fastValues.length > 0) {
    const lastFast = fastValues[fastValues.length - 1];
    const lastClose = closes[closes.length - 1];
    const trendPct = ((lastClose - lastFast) / lastFast) * 100;
    score += Math.min(Math.max(trendPct * 5, -15), 15);
    indicators.ma_trend = trendPct;
  }

  // 3. Kalman Filter Signal
  if (config.kalman) {
    const kf = kalmanFilter(closes, config.kalman);
    const lastState = kf.states[kf.states.length - 1];
    if (lastState) {
      // Positive velocity = uptrend
      const velocityScore = Math.min(Math.max(lastState.velocity * 1000, -20), 20);
      score += velocityScore;
      indicators.kalman_velocity = lastState.velocity;
      indicators.kalman_estimate = lastState.estimate;
      
      // Price above/below Kalman estimate
      const kalmanDiff = ((lastState.value - lastState.estimate) / lastState.estimate) * 100;
      score += Math.min(Math.max(kalmanDiff * 3, -10), 10);
      indicators.kalman_diff = kalmanDiff;
    }
  }

  // 4. RSI
  const rsiPeriod = config.rsiPeriod ?? 14;
  const rsiValues = rsi(closes, rsiPeriod);
  if (rsiValues.length > 0) {
    const currentRSI = rsiValues[rsiValues.length - 1];
    indicators.rsi = currentRSI;

    if (currentRSI < 30) score += 15; // Oversold - buy signal
    else if (currentRSI > 70) score -= 15; // Overbought - sell signal
    else if (currentRSI < 40) score += 5;
    else if (currentRSI > 60) score -= 5;
  }

  // 5. Volume confirmation
  if (volumes.length > 20) {
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const lastVolume = volumes[volumes.length - 1];
    const volumeRatio = lastVolume / avgVolume;
    indicators.volume_ratio = volumeRatio;

    // High volume amplifies signal
    if (volumeRatio > 1.5) {
      score *= 1 + (volumeRatio - 1) * 0.3;
    }
  }

  // Normalize score to -100 to 100
  score = Math.min(Math.max(score, -100), 100);

  // Determine signal type
  let type: SignalResult['type'];
  let confidence: number;

  if (score >= 50) {
    type = 'strong_buy';
    confidence = Math.min(score, 95);
  } else if (score >= 20) {
    type = 'buy';
    confidence = score;
  } else if (score <= -50) {
    type = 'strong_sell';
    confidence = Math.min(Math.abs(score), 95);
  } else if (score <= -20) {
    type = 'sell';
    confidence = Math.abs(score);
  } else {
    type = 'hold';
    confidence = 100 - Math.abs(score) * 2;
  }

  return {
    type,
    confidence: Math.round(confidence),
    reason: generateReason(type, indicators),
    timestamp,
    indicators,
  };
}

function generateReason(type: SignalResult['type'], indicators: Record<string, number>): string {
  const parts: string[] = [];

  if (indicators.ma_crossover === 1) parts.push('Golden cross detected');
  if (indicators.ma_crossover === -1) parts.push('Death cross detected');
  if (indicators.rsi && indicators.rsi < 30) parts.push(`RSI oversold (${indicators.rsi.toFixed(1)})`);
  if (indicators.rsi && indicators.rsi > 70) parts.push(`RSI overbought (${indicators.rsi.toFixed(1)})`);
  if (indicators.kalman_velocity && indicators.kalman_velocity > 0) parts.push('Kalman trend upward');
  if (indicators.kalman_velocity && indicators.kalman_velocity < 0) parts.push('Kalman trend downward');
  if (indicators.volume_ratio && indicators.volume_ratio > 1.5) parts.push(`High volume (${indicators.volume_ratio.toFixed(1)}x avg)`);

  if (parts.length === 0) {
    return type === 'hold' ? 'No strong signals detected' : `${type.replace('_', ' ')} signal from composite analysis`;
  }

  return parts.join('. ');
}
