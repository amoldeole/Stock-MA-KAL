// ============================================================
// Signal Card Component
// ============================================================

'use client';

import { SIGNAL_COLORS, formatSignal, formatTimestamp } from '@stock-ma-kal/shared';

interface SignalCardProps {
  symbol: string;
  type: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  reason: string;
  timestamp: number;
}

export function SignalCard({ symbol, type, confidence, reason, timestamp }: SignalCardProps) {
  const color = SIGNAL_COLORS[type] || '#9E9E9E';

  return (
    <div className="card border-l-4 animate-slide-up" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{symbol}</span>
          <span
            className="badge text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {formatSignal(type)}
          </span>
        </div>
        <span className="text-xs text-text-muted">{formatTimestamp(timestamp, 'time')}</span>
      </div>

      {/* Confidence Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-secondary">Confidence</span>
          <span className="font-mono font-bold" style={{ color }}>{confidence}%</span>
        </div>
        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${confidence}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{reason}</p>
    </div>
  );
}
