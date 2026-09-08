// ============================================================
// Dynamic Features Routes (Server-Driven UI)
// This powers the icons page that updates without APK changes
// ============================================================

import { FastifyInstance } from 'fastify';
import { FeaturePageConfig } from '@stock-ma-kal/shared';
import { redisClient } from '../services/redis';

// Default feature configuration
const defaultFeatures: FeaturePageConfig = {
  version: '1.0.0',
  updatedAt: Date.now(),
  layout: 'grid',
  theme: 'auto',
  categories: [
    {
      id: 'analysis',
      title: 'Analysis Tools',
      order: 1,
      features: ['chart', 'signals', 'kalman', 'compare', 'screener'],
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      order: 2,
      features: ['watchlist', 'alerts', 'portfolio', 'history'],
    },
    {
      id: 'tools',
      title: 'Tools & More',
      order: 3,
      features: ['voice', 'export', 'settings', 'help'],
    },
  ],
  features: [
    {
      id: 'chart',
      title: 'Live Chart',
      description: 'Interactive candlestick charts with MA and Kalman overlays',
      icon: 'TrendingUp',
      route: '/chart',
      component: 'ChartView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 1,
    },
    {
      id: 'signals',
      title: 'Trade Signals',
      description: 'AI-powered buy/sell signals with confidence scores',
      icon: 'Zap',
      route: '/signals',
      component: 'SignalsView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 2,
      badge: 'new',
    },
    {
      id: 'kalman',
      title: 'Kalman Filter',
      description: 'Advanced trend estimation with adaptive filtering',
      icon: 'Activity',
      route: '/kalman',
      component: 'KalmanView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 3,
    },
    {
      id: 'compare',
      title: 'Compare Stocks',
      description: 'Side-by-side stock comparison with indicators',
      icon: 'GitCompare',
      route: '/compare',
      component: 'CompareView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 4,
    },
    {
      id: 'screener',
      title: 'Stock Screener',
      description: 'Filter stocks by criteria and signals',
      icon: 'Filter',
      route: '/screener',
      component: 'ScreenerView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 5,
      badge: 'beta',
    },
    {
      id: 'watchlist',
      title: 'Watchlist',
      description: 'Track your favorite stocks in real-time',
      icon: 'Eye',
      route: '/watchlist',
      component: 'WatchlistView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 6,
    },
    {
      id: 'alerts',
      title: 'Price Alerts',
      description: 'Set notifications for price targets',
      icon: 'Bell',
      route: '/alerts',
      component: 'AlertsView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 7,
    },
    {
      id: 'portfolio',
      title: 'Portfolio Tracker',
      description: 'Monitor your portfolio performance',
      icon: 'PieChart',
      route: '/portfolio',
      component: 'PortfolioView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 8,
    },
    {
      id: 'history',
      title: 'Trade History',
      description: 'Review your past trades and signals',
      icon: 'Clock',
      route: '/history',
      component: 'HistoryView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 9,
    },
    {
      id: 'voice',
      title: 'Voice Commands',
      description: 'Control the app with your voice',
      icon: 'Mic',
      route: '/voice',
      component: 'VoiceView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 10,
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Export charts and analysis as PDF/CSV',
      icon: 'Download',
      route: '/export',
      component: 'ExportView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 11,
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Customize your experience',
      icon: 'Settings',
      route: '/settings',
      component: 'SettingsView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 12,
    },
    {
      id: 'help',
      title: 'Help & Docs',
      description: 'Tutorials and documentation',
      icon: 'HelpCircle',
      route: '/help',
      component: 'HelpView',
      enabled: true,
      minVersion: '1.0.0',
      platforms: ['web', 'ios', 'android'],
      order: 13,
    },
  ],
};

export async function featuresRoutes(app: FastifyInstance) {
  // Get feature configuration (called by both web and mobile)
  app.get('/features', async (request) => {
    const { platform, version } = request.query as { platform?: string; version?: string };

    // Try cache first
    const cached = await redisClient.get<FeaturePageConfig>(`features:${platform || 'all'}`);
    if (cached) return { success: true, data: cached };

    // Get from DB or use defaults
    const features = await getFeaturesFromStorage();

    // Filter by platform and version
    const filtered = filterFeatures(features, platform, version);

    await redisClient.set(`features:${platform || 'all'}`, filtered, 60);

    return { success: true, data: filtered };
  });

  // Admin: Update features
  app.put('/features', async (request) => {
    const config = request.body as FeaturePageConfig;
    config.updatedAt = Date.now();

    await saveFeaturesToStorage(config);
    await redisClient.delPattern('features:*');

    return { success: true, data: config };
  });

  // Admin: Add a new feature
  app.post('/features/add', async (request) => {
    const feature = request.body as any;
    const features = await getFeaturesFromStorage();

    features.features.push(feature);
    features.updatedAt = Date.now();

    await saveFeaturesToStorage(features);
    await redisClient.delPattern('features:*');

    return { success: true, data: features };
  });

  // Admin: Toggle feature
  app.patch('/features/:id/toggle', async (request) => {
    const { id } = request.params as { id: string };
    const features = await getFeaturesFromStorage();

    const feature = features.features.find((f) => f.id === id);
    if (!feature) {
      return { success: false, error: 'Feature not found' };
    }

    feature.enabled = !feature.enabled;
    features.updatedAt = Date.now();

    await saveFeaturesToStorage(features);
    await redisClient.delPattern('features:*');

    return { success: true, data: features };
  });
}

// ─── Storage Helpers ──────────────────────────────────────────

async function getFeaturesFromStorage(): Promise<FeaturePageConfig> {
  const stored = await redisClient.get<FeaturePageConfig>('features:config');
  return stored || { ...defaultFeatures };
}

async function saveFeaturesToStorage(config: FeaturePageConfig): Promise<void> {
  await redisClient.set('features:config', config);
}

function filterFeatures(
  config: FeaturePageConfig,
  platform?: string,
  version?: string
): FeaturePageConfig {
  let features = config.features;

  if (platform && platform !== 'all') {
    features = features.filter((f) => f.platforms.includes(platform as any));
  }

  features = features.filter((f) => f.enabled);

  return {
    ...config,
    features,
  };
}
