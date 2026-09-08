// ============================================================
// Dynamic Features Page (Icons Grid)
// Server-driven - updates without APK redeployment
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { FeaturePageConfig, FeatureConfig } from '@stock-ma-kal/shared';
import { api } from '@/lib/api';

export default function FeaturesPage() {
  const [config, setConfig] = useState<FeaturePageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatures() {
      try {
        const result = await api.getFeatures('web');
        if (result.success) {
          setConfig(result.data);
        }
      } catch (err) {
        console.error('Failed to load features:', err);
      }
      setLoading(false);
    }

    loadFeatures();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 bg-bg-tertiary rounded w-48 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-36 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-bg-tertiary mb-3" />
              <div className="h-4 bg-bg-tertiary rounded w-24 mb-2" />
              <div className="h-3 bg-bg-tertiary rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const categories = config?.categories || [];
  const features = config?.features || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Features</h1>
        <p className="text-text-secondary mt-1">
          Explore all tools and features • Updated v{config?.version || '1.0.0'}
        </p>
      </div>

      {categories.map((category) => {
        const categoryFeatures = features.filter((f) =>
          category.features.includes(f.id)
        );

        if (categoryFeatures.length === 0) return null;

        return (
          <section key={category.id} className="mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {category.title}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryFeatures.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Version info */}
      <div className="mt-12 text-center text-xs text-text-muted">
        <p>Configuration version: {config?.version} • Last updated: {new Date(config?.updatedAt || 0).toLocaleDateString()}</p>
        <p className="mt-1">New features are delivered instantly without app updates</p>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureConfig }) {
  const iconMap: Record<string, JSX.Element> = {
    TrendingUp: <IconTrendingUp />,
    Zap: <IconZap />,
    Activity: <IconActivity />,
    GitCompare: <IconCompare />,
    Filter: <IconFilter />,
    Eye: <IconEye />,
    Bell: <IconBell />,
    PieChart: <IconPieChart />,
    Clock: <IconClock />,
    Mic: <IconMic />,
    Download: <IconDownload />,
    Settings: <IconSettings />,
    HelpCircle: <IconHelp />,
  };

  const badgeColors = {
    new: 'badge-new',
    beta: 'badge-beta',
    premium: 'badge-premium',
  };

  return (
    <a
      href={feature.route}
      className="card group hover:shadow-lg hover:shadow-accent-blue/5 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue group-hover:bg-accent-blue/20 transition-colors">
          {iconMap[feature.icon] || <IconDefault />}
        </div>
        {feature.badge && (
          <span className={badgeColors[feature.badge] || 'badge'}>
            {feature.badge}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-sm mb-1 group-hover:text-accent-blue transition-colors">
        {feature.title}
      </h3>
      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
        {feature.description}
      </p>
    </a>
  );
}

// ─── Simple SVG Icons (inline for speed) ──────────────────────

function IconTrendingUp() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconCompare() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function IconPieChart() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconDefault() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
