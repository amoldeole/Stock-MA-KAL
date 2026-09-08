// ============================================================
// Mobile Features Screen (Dynamic Icons Page)
// Renders features from server config - no APK update needed
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { FeaturePageConfig, FeatureConfig } from '@stock-ma-kal/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function FeaturesScreen() {
  const [config, setConfig] = useState<FeaturePageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/features?platform=android`);
        if (res.ok) {
          const { data } = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load features:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading features...</Text>
      </View>
    );
  }

  const features = config.features.filter((f) => f.enabled);
  const numColumns = 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Features</Text>
      <Text style={styles.subtitle}>
        v{config.version} • Updated {new Date(config.updatedAt).toLocaleDateString()}
      </Text>

      {(config.categories || []).map((category) => {
        const categoryFeatures = features.filter((f) =>
          category.features.includes(f.id)
        );
        if (categoryFeatures.length === 0) return null;

        return (
          <View key={category.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{category.title}</Text>
            <View style={styles.grid}>
              {categoryFeatures.map((feature) => (
                <FeatureTile key={feature.id} feature={feature} />
              ))}
            </View>
          </View>
        );
      })}

      <Text style={styles.footer}>
        New features are delivered instantly without app updates
      </Text>
    </ScrollView>
  );
}

function FeatureTile({ feature }: { feature: FeatureConfig }) {
  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {getEmoji(feature.icon)}
        </Text>
      </View>
      <Text style={styles.tileTitle}>{feature.title}</Text>
      <Text style={styles.tileDesc} numberOfLines={2}>{feature.description}</Text>
      {feature.badge && (
        <View style={[styles.badge, getBadgeStyle(feature.badge)]}>
          <Text style={[styles.badgeText, getBadgeTextStyle(feature.badge)]}>
            {feature.badge.toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getEmoji(icon: string): string {
  const map: Record<string, string> = {
    TrendingUp: '📈', Zap: '⚡', Activity: '💓', GitCompare: '🔄',
    Filter: '🔍', Eye: '👁', Bell: '🔔', PieChart: '📊',
    Clock: '⏰', Mic: '🎤', Download: '📥', Settings: '⚙️', HelpCircle: '❓',
  };
  return map[icon] || '📱';
}

function getBadgeStyle(badge: string) {
  switch (badge) {
    case 'new': return { backgroundColor: 'rgba(63, 185, 80, 0.2)' };
    case 'beta': return { backgroundColor: 'rgba(187, 134, 252, 0.2)' };
    case 'premium': return { backgroundColor: 'rgba(240, 136, 62, 0.2)' };
    default: return {};
  }
}

function getBadgeTextStyle(badge: string) {
  switch (badge) {
    case 'new': return { color: '#3FB950' };
    case 'beta': return { color: '#BB86FC' };
    case 'premium': return { color: '#F0883E' };
    default: return { color: '#8B949E' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, backgroundColor: '#0D1117', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8B949E', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#C9D1D9' },
  subtitle: { fontSize: 13, color: '#8B949E', marginTop: 4, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#C9D1D9', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: { fontSize: 24 },
  tileTitle: { fontSize: 14, fontWeight: '600', color: '#C9D1D9', marginBottom: 4 },
  tileDesc: { fontSize: 11, color: '#8B949E', lineHeight: 16 },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  footer: { textAlign: 'center', color: '#6E7681', fontSize: 11, marginTop: 24 },
});
