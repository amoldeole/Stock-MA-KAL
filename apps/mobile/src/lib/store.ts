// ============================================================
// Mobile Store (Zustand - same API as web store)
// ============================================================

import { create } from 'zustand';
import { StockQuote, TimeFrame, MAConfig } from '@stock-ma-kal/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface StockState {
  watchlist: string[];
  quotes: Record<string, StockQuote>;
  currentSymbol: string;
  currentTimeframe: TimeFrame;

  fetchQuotes: () => Promise<void>;
  setSymbol: (symbol: string) => void;
  setTimeframe: (tf: TimeFrame) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export const useStockStore = create<StockState>((set, get) => ({
  watchlist: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META', 'SPY'],
  quotes: {},
  currentSymbol: 'AAPL',
  currentTimeframe: '1d',

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

  setSymbol: (symbol) => set({ currentSymbol: symbol }),
  setTimeframe: (timeframe) => set({ currentTimeframe: timeframe }),
  addToWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.includes(symbol) ? state.watchlist : [...state.watchlist, symbol],
    })),
  removeFromWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.filter((s) => s !== symbol),
    })),
}));
