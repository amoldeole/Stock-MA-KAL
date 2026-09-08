// ============================================================
// Stock-MA-KAL Shared Types
// Core type definitions used across web, mobile, admin, and server
// ============================================================

// ─── Market Data ─────────────────────────────────────────────

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  timestamp: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: number;
  alerts: PriceAlert[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'above' | 'below' | 'cross';
  price: number;
  indicator?: string;
  triggered: boolean;
  createdAt: number;
}

// ─── Indicators ──────────────────────────────────────────────

export type MAType = 'SMA' | 'EMA' | 'WMA' | 'DEMA' | 'TEMA' | 'HMA' | 'KAMA';

export interface MAConfig {
  type: MAType;
  period: number;
  field?: 'open' | 'high' | 'low' | 'close';
}

export interface KalmanFilterConfig {
  processNoise: number;   // Q - Process noise covariance
  measurementNoise: number; // R - Measurement noise covariance
  estimateError: number;  // P - Estimation error
  initialValue?: number;
}

export interface KalmanState {
  value: number;
  velocity: number;
  estimate: number;
  covariance: number;
  kalmanGain: number;
  timestamp: number;
}

export interface IndicatorResult {
  name: string;
  values: { timestamp: number; value: number }[];
  config: Record<string, unknown>;
}

export interface SignalResult {
  type: 'buy' | 'sell' | 'hold' | 'strong_buy' | 'strong_sell';
  confidence: number; // 0-100
  reason: string;
  timestamp: number;
  indicators: Record<string, number>;
}

// ─── Chart & Analysis ────────────────────────────────────────

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface ChartConfig {
  symbol: string;
  timeframe: TimeFrame;
  indicators: (MAConfig | { type: 'kalman'; config: KalmanFilterConfig })[];
  overlays: ('volume' | 'bollinger' | 'vwap')[];
  dateRange: { start: number; end: number };
}

export interface ChartAnnotation {
  id: string;
  timestamp: number;
  price: number;
  text: string;
  type: 'note' | 'signal' | 'alert';
  color?: string;
}

// ─── Dynamic Features (Server-Driven UI) ─────────────────────

export interface FeatureConfig {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  route: string;
  component: string; // Dynamic component identifier
  enabled: boolean;
  minVersion: string;
  platforms: ('web' | 'ios' | 'android')[];
  order: number;
  badge?: 'new' | 'beta' | 'premium';
  config?: Record<string, unknown>;
}

export interface FeaturePageConfig {
  version: string;
  updatedAt: number;
  features: FeatureConfig[];
  layout: 'grid' | 'list' | 'carousel';
  theme: 'light' | 'dark' | 'auto';
  categories: {
    id: string;
    title: string;
    order: number;
    features: string[]; // feature IDs
  }[];
}

// ─── Voice Commands ──────────────────────────────────────────

export interface VoiceCommand {
  id: string;
  action: VoiceAction;
  parameters: Record<string, string>;
  confidence: number;
  timestamp: number;
}

export type VoiceAction =
  | 'search_stock'
  | 'show_chart'
  | 'add_indicator'
  | 'remove_indicator'
  | 'set_timeframe'
  | 'add_alert'
  | 'switch_tab'
  | 'take_screenshot'
  | 'share_analysis'
  | 'open_settings'
  | 'go_back'
  | 'compare_stocks'
  | 'show_signals'
  | 'export_data'
  | 'toggle_dark_mode';

export interface VoiceCommandResult {
  success: boolean;
  action: VoiceAction;
  message: string;
  data?: Record<string, unknown>;
}

// ─── Admin ───────────────────────────────────────────────────

export interface AppStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  topStocks: { symbol: string; views: number }[];
  topFeatures: { feature: string; usage: number }[];
  platformBreakdown: { platform: string; users: number }[];
  voiceCommandsUsed: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'user';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: number;
  lastActive: number;
  status: 'active' | 'suspended' | 'deleted';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  memory: { used: number; total: number };
  cpu: number;
  latency: number;
  services: { name: string; status: string; latency: number }[];
}

// ─── API Types ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    total?: number;
    limit?: number;
    timestamp: number;
  };
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ─── WebSocket Events ────────────────────────────────────────

export type WSEvent =
  | { type: 'price_update'; data: StockQuote }
  | { type: 'signal'; data: SignalResult }
  | { type: 'alert_triggered'; data: PriceAlert }
  | { type: 'features_updated'; data: FeaturePageConfig }
  | { type: 'system_message'; data: { message: string; level: 'info' | 'warn' | 'error' } };
