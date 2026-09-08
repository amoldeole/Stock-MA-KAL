// ============================================================
// Mobile App - Dashboard Screen
// Shares business logic with web via @stock-ma-kal/shared
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useStockStore } from '../lib/store';
import { formatPrice, formatPercent, formatVolume } from '@stock-ma-kal/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function DashboardScreen() {
  const { watchlist, quotes, fetchQuotes, setSymbol } = useStockStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 15000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuotes();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stock MA-KAL</Text>
        <Text style={styles.subtitle}>Real-time Analysis</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks..."
          placeholderTextColor="#6E7681"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Watchlist */}
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#58A6FF" />
        }
        renderItem={({ item: symbol }) => {
          const quote = quotes[symbol];
          const isUp = (quote?.changePercent ?? 0) >= 0;

          return (
            <TouchableOpacity
              style={styles.stockCard}
              onPress={() => setSymbol(symbol)}
              activeOpacity={0.7}
            >
              <View style={styles.stockInfo}>
                <Text style={styles.stockSymbol}>{symbol}</Text>
                <Text style={styles.stockName}>{quote?.name || 'Loading...'}</Text>
              </View>
              <View style={styles.stockPrice}>
                <Text style={styles.price}>
                  {quote ? formatPrice(quote.price) : '—'}
                </Text>
                <Text style={[styles.change, isUp ? styles.priceUp : styles.priceDown]}>
                  {quote ? formatPercent(quote.changePercent) : '—'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C9D1D9',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#21262D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#C9D1D9',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  stockCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C9D1D9',
  },
  stockName: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  stockPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C9D1D9',
    fontFamily: 'monospace',
  },
  change: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  priceUp: {
    color: '#3FB950',
  },
  priceDown: {
    color: '#F85149',
  },
});
