// ============================================================
// Watchlist Page
// ============================================================

'use client';

import { useEffect } from 'react';
import { useStockStore } from '@/lib/store';
import { StockCard } from '@/components/StockCard';
import { MiniChart } from '@/components/MiniChart';
import { VoiceButton } from '@/components/VoiceButton';
import { formatPrice, formatPercent, formatVolume } from '@stock-ma-kal/shared';

export default function WatchlistPage() {
  const { watchlist, quotes, fetchQuotes, removeFromWatchlist, addToWatchlist } = useStockStore();

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 10000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Watchlist</h1>
          <p className="text-text-secondary mt-1">
            {watchlist.length} stocks tracked in real-time
          </p>
        </div>
        <button className="btn-primary">+ Add Stock</button>
      </div>

      {/* Table view */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Symbol</th>
              <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Price</th>
              <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Change</th>
              <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Volume</th>
              <th className="text-center text-xs text-text-muted font-medium px-4 py-3">Chart</th>
              <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((symbol) => {
              const quote = quotes[symbol];
              const isUp = (quote?.changePercent ?? 0) >= 0;

              return (
                <tr key={symbol} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-bold">{symbol}</div>
                      <div className="text-xs text-text-muted">{quote?.name || ''}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    {quote ? formatPrice(quote.price) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${isUp ? 'price-up' : 'price-down'}`}>
                    {quote ? formatPercent(quote.changePercent) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary">
                    {quote ? formatVolume(quote.volume) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <MiniChart symbol={symbol} width={100} height={30} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeFromWatchlist(symbol)}
                      className="btn-ghost text-xs text-accent-red hover:text-accent-red"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <VoiceButton />
    </div>
  );
}
