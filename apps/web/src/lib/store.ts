// ============================================================
// Global Store (Zustand - lightweight, fast)
// ============================================================

import { create } from 'zustand';
import { StockQuote, TimeFrame, MAConfig, FeatureConfig } from '@stock-ma-kal/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface StockState {
  // Data
  watchlist: string[];
  quotes: Record<string, StockQuote>;
  currentSymbol: string;
  currentTimeframe: TimeFrame;
  indicators: MAConfig[];
  features: FeatureConfig[];

  // UI State
  isVoiceActive: boolean;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';

  // Actions
  fetchQuotes: () => Promise<void>;
  fetchFeatures: () => Promise<void>;
  setSymbol: (symbol: string) => void;
  setTimeframe: (tf: TimeFrame) => void;
  addIndicator: (config: MAConfig) => void;
  removeIndicator: (index: number) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setVoiceActive: (active: boolean) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
}

export const useStockStore = create<StockState>((set, get) => ({
  // Initial state
  watchlist: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META', 'SPY'],
  quotes: {},
  currentSymbol: 'AAPL',
  currentTimeframe: '1d',
  indicators: [
    { type: 'EMA', period: 20 },
    { type: 'EMA', period: 50 },
  ],
  features: [],
  isVoiceActive: false,
  sidebarOpen: true,
  theme: 'dark',

  // Fetch all watchlist quotes
  fetchQuotes: async () => {
    try {
      const symbols = get().watchlist;
      const response = await fetch(`${API_BASE}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });

      if (response.ok) {
        const { data } = await response.json();
        const quotes: Record<string, StockQuote> = {};
        (data || []).forEach((q: StockQuote) => {
          quotes[q.symbol] = q;
        });
        set({ quotes });
      }
    } catch (err) {
      console.warn('Failed to fetch quotes:', err);
    }
  },

  // Fetch dynamic features from server
  fetchFeatures: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/features?platform=web`);
      if (response.ok) {
        const { data } = await response.json();
        set({ features: data?.features || [] });
      }
    } catch (err) {
      console.warn('Failed to fetch features:', err);
    }
  },

  setSymbol: (symbol) => set({ currentSymbol: symbol }),
  setTimeframe: (timeframe) => set({ currentTimeframe: timeframe }),

  addIndicator: (config) =>
    set((state) => ({ indicators: [...state.indicators, config] })),

  removeIndicator: (index) =>
    set((state) => ({
      indicators: state.indicators.filter((_, i) => i !== index),
    })),

  addToWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.includes(symbol)
        ? state.watchlist
        : [...state.watchlist, symbol],
    })),

  removeFromWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.filter((s) => s !== symbol),
    })),

  setVoiceActive: (active) => set({ isVoiceActive: active }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}));
