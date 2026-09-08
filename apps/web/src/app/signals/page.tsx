// ============================================================
// Signals Page
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SignalCard } from '@/components/SignalCard';
import { VoiceButton } from '@/components/VoiceButton';
import { useStockStore } from '@/lib/store';
import { SignalResult } from '@stock-ma-kal/shared';

export default function SignalsPage() {
  const { watchlist } = useStockStore();
  const [signals, setSignals] = useState<(SignalResult & { symbol: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignals() {
      setLoading(true);
      const results = await Promise.all(
        watchlist.map(async (symbol) => {
          try {
            const result = await api.generateSignal(symbol, '1d');
            return { ...result.data, symbol };
          } catch {
            return null;
          }
        })
      );

      setSignals(
        results
          .filter(Boolean)
          .sort((a, b) => Math.abs(b!.confidence) - Math.abs(a!.confidence)) as any
      );
      setLoading(false);
    }

    fetchSignals();
  }, [watchlist]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Trade Signals</h1>
        <p className="text-text-secondary mt-1">
          AI-powered signals from Moving Average + Kalman Filter analysis
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent-green">
            {signals.filter((s) => s.type.includes('buy')).length}
          </div>
          <div className="text-xs text-text-muted mt-1">Buy Signals</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent-orange">
            {signals.filter((s) => s.type === 'hold').length}
          </div>
          <div className="text-xs text-text-muted mt-1">Hold</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent-red">
            {signals.filter((s) => s.type.includes('sell')).length}
          </div>
          <div className="text-xs text-text-muted mt-1">Sell Signals</div>
        </div>
      </div>

      {/* Signal Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-28">
              <div className="h-4 bg-bg-tertiary rounded w-32 mb-3" />
              <div className="h-2 bg-bg-tertiary rounded w-full mb-3" />
              <div className="h-3 bg-bg-tertiary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal, i) => (
            <SignalCard
              key={`${signal.symbol}-${i}`}
              symbol={signal.symbol}
              type={signal.type}
              confidence={signal.confidence}
              reason={signal.reason}
              timestamp={signal.timestamp}
            />
          ))}
        </div>
      )}

      <VoiceButton />
    </div>
  );
}
