// ============================================================
// Application Constants
// ============================================================

export const APP_NAME = 'Stock MA-KAL';
export const APP_VERSION = '1.0.0';

export const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY'];

export const TIMEFRAMES = [
  { value: '1m', label: '1 Min', seconds: 60 },
  { value: '5m', label: '5 Min', seconds: 300 },
  { value: '15m', label: '15 Min', seconds: 900 },
  { value: '30m', label: '30 Min', seconds: 1800 },
  { value: '1h', label: '1 Hour', seconds: 3600 },
  { value: '4h', label: '4 Hours', seconds: 14400 },
  { value: '1d', label: '1 Day', seconds: 86400 },
  { value: '1w', label: '1 Week', seconds: 604800 },
  { value: '1M', label: '1 Month', seconds: 2592000 },
] as const;

export const MA_TYPES = [
  { value: 'SMA', label: 'Simple MA', description: 'Basic arithmetic mean' },
  { value: 'EMA', label: 'Exponential MA', description: 'Recent data weighted more' },
  { value: 'WMA', label: 'Weighted MA', description: 'Linear weight distribution' },
  { value: 'DEMA', label: 'Double EMA', description: 'Reduced lag exponential' },
  { value: 'TEMA', label: 'Triple EMA', description: 'Minimum lag exponential' },
  { value: 'HMA', label: 'Hull MA', description: 'Reduced lag with smoothing' },
  { value: 'KAMA', label: 'Kaufman Adaptive', description: 'Volatility adaptive' },
] as const;

export const MA_PERIODS = [5, 10, 20, 50, 100, 200] as const;

export const SIGNAL_COLORS: Record<string, string> = {
  strong_buy: '#00C853',
  buy: '#4CAF50',
  hold: '#FF9800',
  sell: '#F44336',
  strong_sell: '#D50000',
};

export const CHART_COLORS = {
  bullish: '#00C853',
  bearish: '#F44336',
  neutral: '#9E9E9E',
  grid: 'rgba(255,255,255,0.1)',
  background: '#0D1117',
  surface: '#161B22',
  text: '#C9D1D9',
  accent: '#58A6FF',
  kalman: '#BB86FC',
  volume: 'rgba(88, 166, 255, 0.3)',
};

export const API_ENDPOINTS = {
  quote: '/api/quote',
  history: '/api/history',
  signals: '/api/signals',
  indicators: '/api/indicators',
  watchlist: '/api/watchlist',
  features: '/api/features',
  voice: '/api/voice',
  admin: '/api/admin',
  health: '/api/health',
  ws: '/ws',
} as const;

export const WS_EVENTS = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PRICE_UPDATE: 'price_update',
  SIGNAL: 'signal',
  ALERT_TRIGGERED: 'alert_triggered',
  FEATURES_UPDATED: 'features_updated',
} as const;
