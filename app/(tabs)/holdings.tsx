// VAULT - Holdings Screen (DESIGN LOCKED)
// Features: Search, filters, empty states, delete functionality

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { Icons } from '../../components/ui';
import { useHoldings } from '../../context/HoldingsContext';

const formatCurrency = (value: number | null | undefined, compact = false): string => {
  if (value === null || value === undefined) return 'N/A';
  if (compact && Math.abs(value) >= 1000) {
    return (value < 0 ? '-' : '') + '$' + (Math.abs(value) / 1000).toFixed(1) + 'k';
  }
  return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
};

const Sparkline = ({ positive }: { positive: boolean }) => (
  <Svg width={50} height={24} viewBox="0 0 50 24">
    <Path
      d={positive ? "M0 18 L10 14 L20 16 L30 8 L40 10 L50 4" : "M0 6 L10 10 L20 8 L30 16 L40 14 L50 20"}
      fill="none"
      stroke={positive ? theme.colors.gold.primary : theme.colors.grey[500]}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const Badge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    stock: '#2E7D32',
    etf: '#1565C0',
    crypto: '#F57C00',
    commodity: '#B8860B',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[type] || '#666' }]}>
      <Text style={styles.badgeText}>{type.toUpperCase()}</Text>
    </View>
  );
};

const FILTERS = ['all', 'crypto', 'stocks', 'etfs', 'commodities'];

export default function HoldingsScreen() {
  const router = useRouter();
  const { holdings, removeHolding, metrics } = useHoldings();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showBalance, setShowBalance] = useState(true);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  // Filter holdings based on search and type filter
  const filteredHoldings = useMemo(() => {
    // Start with all holdings
    let result = holdings;
    
    // Filter by type if not "all"
    if (activeFilter !== 'all') {
      const typeMap: Record<string, string> = {
        crypto: 'crypto',
        stocks: 'stock',
        etfs: 'etf',
        commodities: 'commodity',
      };
      const targetType = typeMap[activeFilter];
      if (targetType) {
        result = result.filter(h => h.type === targetType);
      }
    }
    
    // Filter by search text
    const query = searchText.trim().toLowerCase();
    if (query.length > 0) {
      result = result.filter(h => {
        const nameMatch = h.name.toLowerCase().includes(query);
        const symbolMatch = h.symbol.toLowerCase().includes(query);
        return nameMatch || symbolMatch;
      });
    }
    
    // Sort by value (highest first)
    return [...result].sort((a, b) => b.currentValue - a.currentValue);
  }, [holdings, activeFilter, searchText]);

  const totalFiltered = filteredHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const isEmpty = holdings.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Holdings</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/asset/add')}
          >
            <Icons.Plus color={theme.colors.gold.primary} size={18} />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icons.Search color={theme.colors.grey[500]} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search holdings..."
            placeholderTextColor={theme.colors.grey[600]}
            value={searchText}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icons.X color={theme.colors.grey[500]} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            {FILTERS.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Summary Bar */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.summaryBar}>
          <Text style={styles.summaryCount}>{filteredHoldings.length} assets</Text>
          <Text style={styles.summaryValue}>
            {isEmpty ? 'N/A' : formatCurrency(totalFiltered)}
          </Text>
        </Animated.View>

        {/* Holdings List or Empty State */}
        {filteredHoldings.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(500)} style={styles.emptyState}>
            <Icons.Search color={theme.colors.grey[600]} size={48} />
            <Text style={styles.emptyTitle}>
              {isEmpty ? 'No holdings yet' : 'No results found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isEmpty
                ? 'Add assets to start tracking your portfolio'
                : 'Try adjusting your search or filters'}
            </Text>
            {isEmpty && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/asset/add')}
              >
                <Text style={styles.emptyButtonText}>Add Asset</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(500)} style={styles.holdingsList}>
            {filteredHoldings.map((holding, index) => {
              const rankColors = [
                theme.colors.gold.primary,
                theme.colors.silver.primary,
                theme.colors.bronze.primary,
                theme.colors.copper.primary,
                theme.colors.brass.primary,
              ];
              const positive = holding.dayChangePercent >= 0;
              const allocation = metrics.totalValue > 0
                ? Math.round((holding.currentValue / metrics.totalValue) * 100)
                : 0;

              return (
                <View key={holding.id} style={styles.holdingItem}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: rankColors[index] || theme.colors.grey[800] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        index >= 5 && { color: theme.colors.grey[400] },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  
                  <View style={styles.holdingInfo}>
                    <View style={styles.holdingNameRow}>
                      <Text style={styles.holdingName}>{holding.name}</Text>
                      <Badge type={holding.type} />
                    </View>
                    <Text style={styles.holdingMeta}>
                      {holding.symbol} · {holding.quantity} · {allocation}%
                    </Text>
                  </View>
                  
                  <Sparkline positive={positive} />
                  
                  <View style={styles.holdingValues}>
                    <Text style={styles.holdingValue}>
                      {showBalance ? formatCurrency(holding.currentValue, true) : '•••'}
                    </Text>
                    <Text
                      style={[
                        styles.holdingChange,
                        positive && styles.holdingChangePositive,
                      ]}
                    >
                      {formatPercent(holding.dayChangePercent)}
                    </Text>
                    <Text
                      style={[
                        styles.holdingGain,
                        holding.gain >= 0 && styles.holdingGainPositive,
                      ]}
                    >
                      {showBalance ? formatCurrency(holding.gain, true) : '•••'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeHolding(holding.id)}
                  >
                    <Icons.X color={theme.colors.grey[600]} size={16} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black.rich,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white.pure,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gold.subtle,
    borderWidth: 1,
    borderColor: theme.colors.gold.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    marginBottom: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.white.pure,
    height: 48,
    paddingVertical: 0,
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filtersContent: {
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
  },
  filterButtonActive: {
    backgroundColor: theme.colors.gold.subtle,
    borderColor: theme.colors.gold.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.grey[400],
  },
  filterTextActive: {
    color: theme.colors.gold.primary,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey[900],
  },
  summaryCount: {
    fontSize: 13,
    color: theme.colors.grey[500],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  emptyState: {
    padding: 40,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.grey[500],
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: theme.colors.gold.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.black.pure,
  },
  holdingsList: {
    gap: 10,
  },
  holdingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 16,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.black.pure,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  holdingName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  holdingMeta: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  holdingValues: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  holdingChange: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.grey[500],
  },
  holdingChangePositive: {
    color: theme.colors.gold.primary,
  },
  holdingGain: {
    fontSize: 10,
    color: theme.colors.grey[500],
    marginTop: 2,
  },
  holdingGainPositive: {
    color: theme.colors.gold.primary,
  },
  deleteButton: {
    padding: 4,
  },
});