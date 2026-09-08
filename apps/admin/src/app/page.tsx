'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/stats`),
          fetch(`${API_BASE}/api/admin/health`),
        ]);

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s.data);
        }
        if (healthRes.ok) {
          const h = await healthRes.json();
          setHealth(h.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      }
      setLoading(false);
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-admin-surface rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" />
        <StatCard title="Active Users" value={stats?.activeUsers || 0} icon="🟢" />
        <StatCard title="Total Requests" value={stats?.totalRequests || 0} icon="📡" />
        <StatCard title="Avg Response" value={`${stats?.avgResponseTime || 0}ms`} icon="⚡" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Stocks */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Stocks</h2>
          <div className="space-y-3">
            {(stats?.topStocks || []).map((stock: any, i: number) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-admin-muted text-sm">#{i + 1}</span>
                  <span className="font-mono font-bold">{stock.symbol}</span>
                </div>
                <span className="text-sm text-admin-muted">{stock.views.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Features */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Features</h2>
          <div className="space-y-3">
            {(stats?.topFeatures || []).map((feature: any, i: number) => (
              <div key={feature.feature} className="flex items-center justify-between">
                <span className="text-sm">{feature.feature}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-admin-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-admin-accent rounded-full"
                      style={{ width: `${(feature.usage / 16000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-admin-muted w-14 text-right">
                    {feature.usage.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {(stats?.platformBreakdown || []).map((p: any) => (
          <div key={p.platform} className="card text-center">
            <div className="text-3xl mb-2">
              {p.platform === 'Web' ? '🌐' : p.platform === 'Android' ? '🤖' : '🍎'}
            </div>
            <div className="text-2xl font-bold">{p.users.toLocaleString()}</div>
            <div className="text-sm text-admin-muted">{p.platform}</div>
          </div>
        ))}
      </div>

      {/* System Health */}
      {health && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            System Health
            <span className={`ml-3 text-sm font-normal px-2 py-0.5 rounded-full ${
              health.status === 'healthy' ? 'bg-admin-success/20 text-admin-success' : 'bg-admin-danger/20 text-admin-danger'
            }`}>
              {health.status}
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HealthMetric label="Uptime" value={`${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`} />
            <HealthMetric label="Memory" value={`${health.memory.used}MB / ${health.memory.total}MB`} />
            <HealthMetric label="CPU" value={`${health.cpu}ms`} />
            <HealthMetric label="Latency" value={`${health.latency}ms`} />
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {(health.services || []).map((s: any) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${s.status === 'running' || s.status === 'connected' || s.status === 'active' ? 'bg-admin-success' : 'bg-admin-danger'}`} />
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice commands stats */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-2">Voice Commands</h2>
        <div className="text-3xl font-bold text-admin-accent">{stats?.voiceCommandsUsed || 0}</div>
        <p className="text-sm text-admin-muted">Total voice commands processed</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-admin-muted">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}

function HealthMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-admin-muted mb-1">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}
