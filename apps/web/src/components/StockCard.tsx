// ============================================================
// Stock Card Component
// ============================================================

'use client';

import { StockQuote, formatPrice, formatPercent, formatVolume } from '@stock-ma-kal/shared';

interface StockCardProps {
  symbol: string;
  quote?: StockQuote;
  onClick?: () => void;
}

export function StockCard({ symbol, quote, onClick }: StockCardProps) {
  const isUp = (quote?.changePercent ?? 0) >= 0;
  const price = quote?.price ?? 0;
  const change = quote?.changePercent ?? 0;

  return (
    <div
      className="card cursor-pointer hover:shadow-lg hover:shadow-accent-blue/5 group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{symbol}</h3>
          <p className="text-xs text-text-muted truncate max-w-[140px]">
            {quote?.name || 'Loading...'}
          </p>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUp ? 'bg-accent-green/10' : 'bg-accent-red/10'
        }`}>
          <svg
            className={`w-4 h-4 ${isUp ? 'text-accent-green' : 'text-accent-red rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-xl font-bold font-mono">
          {price > 0 ? formatPrice(price) : '—'}
        </span>
        <span className={`text-sm font-semibold ${isUp ? 'price-up' : 'price-down'}`}>
          {quote ? formatPercent(change) : '—'}
        </span>
      </div>

      {quote?.volume && (
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <span>Vol: {formatVolume(quote.volume)}</span>
        </div>
      )}
    </div>
  );
}
