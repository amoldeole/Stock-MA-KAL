'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function FeaturesAdminPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/features?platform=all`);
        if (res.ok) {
          const { data } = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const toggleFeature = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/features/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const { data } = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="animate-pulse text-admin-muted">Loading features...</div>;

  const features = config?.features || [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feature Management</h1>
          <p className="text-admin-muted text-sm mt-1">
            Control which features appear in the app and web platform. Changes take effect instantly.
          </p>
        </div>
        <button className="px-4 py-2 bg-admin-accent text-white rounded-lg text-sm font-medium hover:opacity-90">
          + Add Feature
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="text-left text-xs text-admin-muted font-medium px-4 py-3">Feature</th>
              <th className="text-left text-xs text-admin-muted font-medium px-4 py-3">Route</th>
              <th className="text-center text-xs text-admin-muted font-medium px-4 py-3">Platforms</th>
              <th className="text-center text-xs text-admin-muted font-medium px-4 py-3">Badge</th>
              <th className="text-center text-xs text-admin-muted font-medium px-4 py-3">Status</th>
              <th className="text-right text-xs text-admin-muted font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature: any) => (
              <tr key={feature.id} className="border-b border-admin-border/50 hover:bg-admin-bg/50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{feature.title}</div>
                    <div className="text-xs text-admin-muted">{feature.description}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-admin-bg px-2 py-0.5 rounded">{feature.route}</code>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {feature.platforms?.map((p: string) => (
                      <span key={p} className="text-xs bg-admin-bg px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {feature.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      feature.badge === 'new' ? 'bg-admin-success/20 text-admin-success' :
                      feature.badge === 'beta' ? 'bg-admin-accent/20 text-admin-accent' :
                      'bg-admin-warning/20 text-admin-warning'
                    }`}>
                      {feature.badge}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      feature.enabled ? 'bg-admin-success' : 'bg-admin-border'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      feature.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-admin-accent hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
