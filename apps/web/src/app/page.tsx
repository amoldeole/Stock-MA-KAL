'use client';

import { useEffect, useState } from 'react';
import { StockCard } from '@/components/StockCard';
import { SignalCard } from '@/components/SignalCard';
import { MiniChart } from '@/components/MiniChart';
import { useStockStore } from '@/lib/store';
import { formatMarketCap, formatVolume } from '@stock-ma-kal/shared';

export default function DashboardPage() {
  const { watchlist, quotes, fetchQuotes } = useStockStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 10000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  if (!mounted) return <DashboardSkeleton />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Real-time market analysis with Moving Averages & Kalman Filter
        </p>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MarketCard
          title="S&P 500"
          symbol="SPY"
          value={quotes['SPY']?.price || 525.30}
          change={quotes['SPY']?.changePercent || 0.45}
        />
        <MarketCard
          title="NASDAQ"
          symbol="QQQ"
          value={quotes['QQQ']?.price || 445.20}
          change={quotes['QQQ']?.changePercent || 0.67}
        />
        <MarketCard
          title="Active Signals"
          symbol=""
          value={12}
          change={3}
          isCount
        />
        <MarketCard
          title="Kalman Alerts"
          symbol=""
          value={5}
          change={-2}
          isCount
        />
      </div>

      {/* Watchlist */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Watchlist</h2>
          <button className="btn-ghost text-sm">View All →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {watchlist.map((symbol) => (
            <StockCard
              key={symbol}
              symbol={symbol}
              quote={quotes[symbol]}
            />
          ))}
        </div>
      </section>

      {/* Latest Signals */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Latest Signals</h2>
          <a href="/signals" className="btn-ghost text-sm">View All →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SignalCard
            symbol="NVDA"
            type="strong_buy"
            confidence={87}
            reason="Golden cross with strong Kalman velocity"
            timestamp={Date.now() - 300000}
          />
          <SignalCard
            symbol="AAPL"
            type="buy"
            confidence={65}
            reason="EMA crossover confirmed, RSI recovering"
            timestamp={Date.now() - 600000}
          />
          <SignalCard
            symbol="TSLA"
            type="sell"
            confidence={72}
            reason="Death cross with declining Kalman estimate"
            timestamp={Date.now() - 900000}
          />
        </div>
      </section>
    </div>
  );
}

function MarketCard({
  title,
  symbol,
  value,
  change,
  isCount,
}: {
  title: string;
  symbol: string;
  value: number;
  change: number;
  isCount?: boolean;
}) {
  const isUp = change >= 0;
  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary">{title}</span>
        {symbol && <span className="text-xs font-mono text-text-muted">{symbol}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold font-mono">
          {isCount ? value : `$${value.toFixed(2)}`}
        </span>
        <span className={`text-sm font-medium ${isUp ? 'price-up' : 'price-down'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)}{isCount ? '' : '%'}
        </span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 bg-bg-tertiary rounded w-48 mb-2" />
      <div className="h-4 bg-bg-tertiary rounded w-96 mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-24">
            <div className="h-3 bg-bg-tertiary rounded w-20 mb-4" />
            <div className="h-6 bg-bg-tertiary rounded w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
