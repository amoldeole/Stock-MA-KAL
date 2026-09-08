// ============================================================
// Mini Chart Component (SVG-based for speed)
// ============================================================

'use client';

import { useEffect, useState, useMemo } from 'react';

interface MiniChartProps {
  symbol: string;
  width?: number;
  height?: number;
  className?: string;
}

export function MiniChart({ symbol, width = 120, height = 40, className = '' }: MiniChartProps) {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    // Generate mock sparkline data (replace with real data from API)
    const points: number[] = [];
    let value = 50 + Math.random() * 50;
    for (let i = 0; i < 30; i++) {
      value += (Math.random() - 0.48) * 3;
      value = Math.max(20, Math.min(80, value));
      points.push(value);
    }
    setData(points);
  }, [symbol]);

  const { path, color } = useMemo(() => {
    if (data.length < 2) return { path: '', color: '#9E9E9E' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    const points = data.map((val, i) => ({
      x: i * step,
      y: height - ((val - min) / range) * height,
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const isUp = data[data.length - 1] >= data[0];
    const color = isUp ? '#3FB950' : '#F85149';

    return { path: pathD, color };
  }, [data, width, height]);

  if (!path) return <div className={className} style={{ width, height }} />;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={`${path} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#grad-${symbol})`}
      />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
