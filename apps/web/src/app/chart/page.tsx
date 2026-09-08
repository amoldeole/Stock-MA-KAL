// ============================================================
// Chart Page - Main Trading Chart
// ============================================================

'use client';

import { useEffect, useState, useRef } from 'react';
import { useStockStore } from '@/lib/store';
import { api } from '@/lib/api';
import { VoiceButton } from '@/components/VoiceButton';
import { TIMEFRAMES, MA_TYPES, MA_PERIODS, TimeFrame, MAConfig } from '@stock-ma-kal/shared';

export default function ChartPage() {
  const { currentSymbol, currentTimeframe, indicators, setSymbol, setTimeframe, addIndicator, removeIndicator } = useStockStore();
  const [chartData, setChartData] = useState<any[]>([]);
  const [maData, setMaData] = useState<Record<string, any[]>>({});
  const [kalmanData, setKalmanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showKalman, setShowKalman] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch chart data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [history, kalman] = await Promise.all([
          api.getHistory(currentSymbol, currentTimeframe),
          showKalman ? api.calculateKalman(currentSymbol, currentTimeframe) : Promise.resolve(null),
        ]);

        setChartData(history.data || []);
        if (kalman?.data) setKalmanData(kalman.data);

        // Fetch MA data for each indicator
        const maResults: Record<string, any[]> = {};
        for (const ind of indicators) {
          const result = await api.calculateMA(currentSymbol, currentTimeframe, ind);
          if (result?.data?.values) {
            maResults[`${ind.type}(${ind.period})`] = result.data.values;
          }
        }
        setMaData(maResults);
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      }
      setLoading(false);
    }

    fetchData();
  }, [currentSymbol, currentTimeframe, indicators, showKalman]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b border-border-primary bg-bg-secondary">
        {/* Symbol */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentSymbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="input w-24 font-mono font-bold text-lg text-center"
          />
        </div>

        {/* Timeframe buttons */}
        <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value as TimeFrame)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentTimeframe === tf.value
                  ? 'bg-accent-blue text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-2 ml-auto">
          {indicators.map((ind, i) => (
            <span key={i} className="badge bg-accent-blue/20 text-accent-blue cursor-pointer group"
              onClick={() => removeIndicator(i)}>
              {ind.type}({ind.period})
              <span className="ml-1 opacity-0 group-hover:opacity-100">×</span>
            </span>
          ))}
          <select
            className="input text-xs w-auto py-1"
            onChange={(e) => {
              const [type, period] = e.target.value.split('-');
              addIndicator({ type: type as any, period: parseInt(period) });
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>+ Add MA</option>
            {MA_TYPES.map((ma) =>
              MA_PERIODS.map((p) => (
                <option key={`${ma.value}-${p}`} value={`${ma.value}-${p}`}>
                  {ma.label} ({p})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Kalman toggle */}
        <button
          onClick={() => setShowKalman(!showKalman)}
          className={`btn text-xs ${showKalman ? 'bg-accent-purple/20 text-accent-purple' : 'btn-ghost'}`}
        >
          Kalman
        </button>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative p-4" ref={chartRef}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-text-muted text-sm">Loading chart data...</span>
            </div>
          </div>
        ) : (
          <ChartCanvas
            data={chartData}
            maData={maData}
            kalmanData={kalmanData}
            showKalman={showKalman}
            symbol={currentSymbol}
          />
        )}
      </div>

      <VoiceButton />
    </div>
  );
}

// ─── Canvas-based chart (lightweight, no external deps for rendering) ───

function ChartCanvas({
  data,
  maData,
  kalmanData,
  showKalman,
  symbol,
}: {
  data: any[];
  maData: Record<string, any[]>;
  kalmanData: any;
  showKalman: boolean;
  symbol: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };

    // Clear
    ctx.fillStyle = '#0D1117';
    ctx.fillRect(0, 0, w, h);

    if (data.length === 0) return;

    // Calculate price range
    const closes = data.map((d) => d.close);
    const minPrice = Math.min(...data.map((d) => d.low)) * 0.998;
    const maxPrice = Math.max(...data.map((d) => d.high)) * 1.002;
    const priceRange = maxPrice - minPrice;

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const barWidth = chartW / data.length;

    const priceToY = (price: number) =>
      padding.top + chartH - ((price - minPrice) / priceRange) * chartH;
    const indexToX = (i: number) => padding.left + i * barWidth + barWidth / 2;

    // Grid lines
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.5)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Price label
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = '#6E7681';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${price.toFixed(2)}`, w - padding.right + 5, y + 4);
    }

    // Draw candlesticks
    const candleWidth = Math.max(barWidth * 0.6, 1);
    data.forEach((d, i) => {
      const x = indexToX(i);
      const isUp = d.close >= d.open;

      // Wick
      ctx.strokeStyle = isUp ? '#3FB950' : '#F85149';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(d.high));
      ctx.lineTo(x, priceToY(d.low));
      ctx.stroke();

      // Body
      ctx.fillStyle = isUp ? '#3FB950' : '#F85149';
      const top = priceToY(Math.max(d.open, d.close));
      const bottom = priceToY(Math.min(d.open, d.close));
      const bodyHeight = Math.max(bottom - top, 1);
      ctx.fillRect(x - candleWidth / 2, top, candleWidth, bodyHeight);
    });

    // Draw MAs
    const maColors = ['#58A6FF', '#F0883E', '#BB86FC', '#D29922', '#3FB950', '#F85149'];
    Object.entries(maData).forEach(([name, values], idx) => {
      if (!values || values.length === 0) return;
      ctx.strokeStyle = maColors[idx % maColors.length];
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const offset = data.length - values.length;
      values.forEach((v: any, i: number) => {
        const x = indexToX(i + offset);
        const y = priceToY(v.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Label
      const lastVal = values[values.length - 1];
      if (lastVal) {
        ctx.fillStyle = maColors[idx % maColors.length];
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(name, padding.left + 5, padding.top + 15 + idx * 14);
      }
    });

    // Draw Kalman filter
    if (showKalman && kalmanData?.estimates) {
      ctx.strokeStyle = '#BB86FC';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();

      const estimates = kalmanData.estimates;
      const offset = data.length - estimates.length;
      estimates.forEach((e: any, i: number) => {
        const x = indexToX(i + offset);
        const y = priceToY(e.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#BB86FC';
      ctx.font = '10px JetBrains Mono, monospace';
      const maCount = Object.keys(maData).length;
      ctx.fillText('Kalman', padding.left + 5, padding.top + 15 + maCount * 14);
    }

    // Symbol label
    ctx.fillStyle = '#C9D1D9';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(symbol, padding.left + 5, padding.top + 12);
  }, [data, maData, kalmanData, showKalman, symbol]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
