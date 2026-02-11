// VAULT - Asset Detail Screen (Real Data, Real Charts, Transaction History)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Line, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { theme } from '../../constants/theme';
import { Icons, Card, SectionHeader, Badge, Button } from '../../components/ui';
import { useHoldings } from '../../context/HoldingsContext';
import { useTransactions, Transaction } from '../../context/TransactionContext';
import { useCurrency } from '../../context/CurrencyContext';
import { fetchHistoricalPricesCached, ChartPoint } from '../../services/historicalPriceService';
import { useAlerts } from '../../context/AlertsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 160;

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
};

const getRelativeTime = (dateStr: string): string => {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { holdings, removeHolding } = useHoldings();
  const { transactions, fetchTransactions, loading: txLoading } = useTransactions();
  const { formatPrice, currency } = useCurrency();
  const { addAlert } = useAlerts();

  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartChange, setChartChange] = useState<{ value: number; percent: number }>({ value: 0, percent: 0 });

  // Find the real asset from HoldingsContext
  const asset = holdings.find(h => h.id === id);

  // Fetch transactions for this asset
  useEffect(() => {
    if (asset) {
      fetchTransactions(asset.id);
    }
  }, [asset?.id]);

  // Fetch real chart data
  const loadChart = useCallback(async () => {
    if (!asset) return;

    setChartLoading(true);
    try {
      const data = await fetchHistoricalPricesCached(
        asset.symbol,
        asset.type,
        selectedRange,
        asset.currentPrice,
      );

      setChartData(data);

      // Calculate chart period change
      if (data.length > 1) {
        const startPrice = data[0].value;
        const endPrice = data[data.length - 1].value;
        const change = endPrice - startPrice;
        const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;
        setChartChange({ value: change, percent: changePercent });
      }
    } catch (err) {
      console.error('Error loading chart:', err);
    } finally {
      setChartLoading(false);
    }
  }, [asset?.symbol, asset?.type, asset?.currentPrice, selectedRange]);

  useEffect(() => { loadChart(); }, [loadChart]);

  if (!asset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Asset not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const isPositive = asset.dayChangePercent >= 0;
  const chartPositive = chartChange.percent >= 0;

  // Generate SVG path from real data
  const generatePath = (): string => {
    if (chartData.length < 2) return '';

    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const points = chartData.map((point, i) => {
      const x = (i / (chartData.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((point.value - minValue) / range) * (CHART_HEIGHT - 20) - 10;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const generateAreaPath = (): string => {
    const linePath = generatePath();
    if (!linePath) return '';
    return `${linePath} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Asset',
      `Remove ${asset.name} (${asset.symbol}) from your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeHolding(asset.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddAlert = () => {
    Alert.prompt(
      'Set Price Alert',
      `Enter target price for ${asset.symbol} (current: ${formatPrice(asset.currentPrice)})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Alert Above',
          onPress: async (value) => {
            const price = parseFloat(value || '0');
            if (price > 0) {
              try {
                await addAlert({ symbol: asset.symbol, name: asset.name, targetPrice: price, condition: 'above' });
                Alert.alert('Alert Set', `You'll be notified when ${asset.symbol} goes above ${formatPrice(price)}`);
              } catch { Alert.alert('Error', 'Failed to set alert'); }
            }
          },
        },
        {
          text: 'Alert Below',
          onPress: async (value) => {
            const price = parseFloat(value || '0');
            if (price > 0) {
              try {
                await addAlert({ symbol: asset.symbol, name: asset.name, targetPrice: price, condition: 'below' });
                Alert.alert('Alert Set', `You'll be notified when ${asset.symbol} goes below ${formatPrice(price)}`);
              } catch { Alert.alert('Error', 'Failed to set alert'); }
            }
          },
        },
      ],
      'plain-text',
      asset.currentPrice.toFixed(2),
    );
  };

  // Filter transactions for this asset
  const assetTransactions = transactions.filter(
    tx => tx.holdingId === asset.id || tx.symbol.toUpperCase() === asset.symbol.toUpperCase()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Icons.ChevronLeft color={theme.colors.white.pure} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.symbol}>{asset.symbol}</Text>
            <Badge text={asset.type.toUpperCase()} />
          </View>
          <TouchableOpacity style={styles.alertBtn} onPress={handleAddAlert}>
            <Icons.Bell color={theme.colors.gold.primary} size={20} />
          </TouchableOpacity>
        </Animated.View>

        {/* Price Section */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.priceSection}>
          <Text style={styles.assetName}>{asset.name}</Text>
          <Text style={styles.currentPrice}>{formatPrice(asset.currentPrice)}</Text>
          <View style={styles.priceChangeRow}>
            {isPositive ? (
              <Icons.TrendUp color={theme.colors.gold.primary} size={16} />
            ) : (
              <Icons.TrendDown color={theme.colors.grey[500]} size={16} />
            )}
            <Text style={[styles.priceChange, { color: isPositive ? theme.colors.gold.primary : theme.colors.grey[500] }]}>
              {formatPercent(asset.dayChangePercent)}
            </Text>
            <Text style={styles.pricePeriod}>Today</Text>
          </View>
        </Animated.View>

        {/* Chart */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.chartContainer}>
          {chartLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator color={theme.colors.gold.primary} />
            </View>
          ) : chartData.length > 1 ? (
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <SvgGradient id="assetAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={chartPositive ? theme.colors.gold.primary : theme.colors.grey[500]} stopOpacity={0.3} />
                  <Stop offset="100%" stopColor={chartPositive ? theme.colors.gold.primary : theme.colors.grey[500]} stopOpacity={0} />
                </SvgGradient>
              </Defs>

              {[0, 1, 2, 3, 4].map(i => (
                <Line key={i} x1={0} y1={(i * CHART_HEIGHT) / 4} x2={CHART_WIDTH} y2={(i * CHART_HEIGHT) / 4}
                  stroke={theme.colors.grey[900]} strokeWidth={1} strokeDasharray="4,4" />
              ))}

              <Path d={generateAreaPath()} fill="url(#assetAreaGrad)" />
              <Path d={generatePath()} fill="none"
                stroke={chartPositive ? theme.colors.gold.primary : theme.colors.grey[500]}
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ) : (
            <View style={styles.chartLoading}>
              <Text style={styles.noDataText}>No chart data available</Text>
            </View>
          )}

          {/* Chart period stats */}
          {chartData.length > 1 && !chartLoading && (
            <View style={styles.chartStats}>
              <Text style={[styles.chartStatText, { color: chartPositive ? theme.colors.gold.primary : theme.colors.grey[500] }]}>
                {chartPositive ? '+' : ''}{formatPrice(chartChange.value)} ({formatPercent(chartChange.percent)})
              </Text>
              <Text style={styles.chartStatLabel}>{selectedRange} change</Text>
            </View>
          )}

          {/* Time range selector */}
          <View style={styles.timeRanges}>
            {TIME_RANGES.map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.timeBtn, selectedRange === range && styles.timeBtnActive]}
                onPress={() => setSelectedRange(range)}
              >
                <Text style={[styles.timeBtnText, selectedRange === range && styles.timeBtnTextActive]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Your Position */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <SectionHeader title="Your Position" />
          <Card style={styles.positionCard}>
            <View style={styles.positionRow}>
              <View style={styles.positionItem}>
                <Text style={styles.positionLabel}>QUANTITY</Text>
                <Text style={styles.positionValue}>{asset.quantity}</Text>
              </View>
              <View style={styles.positionItem}>
                <Text style={styles.positionLabel}>AVG COST</Text>
                <Text style={styles.positionValue}>{formatPrice(asset.purchasePrice)}</Text>
              </View>
            </View>
            <View style={styles.positionRow}>
              <View style={styles.positionItem}>
                <Text style={styles.positionLabel}>TOTAL VALUE</Text>
                <Text style={styles.positionValue}>{formatPrice(asset.currentValue)}</Text>
              </View>
              <View style={styles.positionItem}>
                <Text style={styles.positionLabel}>TOTAL P/L</Text>
                <Text style={[styles.positionValue, { color: asset.gain >= 0 ? theme.colors.gold.primary : theme.colors.grey[500] }]}>
                  {asset.gain >= 0 ? '+' : ''}{formatPrice(asset.gain)} ({formatPercent(asset.gainPercent)})
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Key Statistics */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)}>
          <SectionHeader title="Key Statistics" />
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DAY CHANGE</Text>
              <Text style={[styles.statValue, { color: isPositive ? theme.colors.gold.primary : theme.colors.grey[500] }]}>
                {formatPercent(asset.dayChangePercent)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>COST BASIS</Text>
              <Text style={styles.statValue}>{formatPrice(asset.totalCost)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TYPE</Text>
              <Text style={styles.statValue}>{asset.type.toUpperCase()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>CURRENCY</Text>
              <Text style={styles.statValue}>{currency}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Transaction History */}
        <Animated.View entering={FadeInUp.duration(600).delay(500)}>
          <SectionHeader title="Transaction History" />
          {txLoading ? (
            <View style={styles.txLoading}>
              <ActivityIndicator color={theme.colors.gold.primary} size="small" />
            </View>
          ) : assetTransactions.length > 0 ? (
            <View style={styles.transactionList}>
              {assetTransactions.map(tx => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={[
                    styles.transactionIcon,
                    (tx.type === 'buy' || tx.type === 'dividend') ? styles.transactionIconBuy : styles.transactionIconSell,
                  ]}>
                    {tx.type === 'buy' ? (
                      <Icons.ArrowDown color={theme.colors.gold.primary} size={14} />
                    ) : tx.type === 'sell' ? (
                      <Icons.ArrowUp color={theme.colors.grey[300]} size={14} />
                    ) : (
                      <Icons.Plus color={theme.colors.gold.primary} size={14} />
                    )}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                      {tx.type === 'buy' ? 'Bought' : tx.type === 'sell' ? 'Sold' : tx.type === 'dividend' ? 'Dividend' : 'Transfer'}
                    </Text>
                    <Text style={styles.transactionDate}>{getRelativeTime(tx.createdAt)}</Text>
                  </View>
                  <View style={styles.transactionValues}>
                    <Text style={styles.transactionQty}>
                      {tx.type === 'buy' ? '+' : tx.type === 'sell' ? '-' : ''}{tx.quantity}
                    </Text>
                    <Text style={styles.transactionTotal}>{formatPrice(tx.total)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>No transactions recorded yet</Text>
            </View>
          )}
        </Animated.View>

        {/* Remove Asset */}
        <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.removeSection}>
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Icons.Minus color="#ef4444" size={16} />
            <Text style={styles.removeText}>Remove from Portfolio</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.black.rich },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  errorText: { fontSize: 18, color: theme.colors.white.pure },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symbol: { fontSize: 18, fontWeight: '700', color: theme.colors.white.pure },
  alertBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.gold.subtle, alignItems: 'center', justifyContent: 'center' },

  priceSection: { alignItems: 'center', marginBottom: 24 },
  assetName: { fontSize: 14, color: theme.colors.grey[400], marginBottom: 4 },
  currentPrice: { fontSize: 36, fontWeight: '700', color: theme.colors.white.pure, marginBottom: 8 },
  priceChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceChange: { fontSize: 14, fontWeight: '600' },
  pricePeriod: { fontSize: 12, color: theme.colors.grey[600] },

  chartContainer: { marginBottom: 24 },
  chartLoading: { height: CHART_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  noDataText: { fontSize: 13, color: theme.colors.grey[500] },
  chartStats: { alignItems: 'center', marginTop: 8 },
  chartStatText: { fontSize: 13, fontWeight: '600' },
  chartStatLabel: { fontSize: 11, color: theme.colors.grey[500], marginTop: 2 },
  timeRanges: { flexDirection: 'row', backgroundColor: theme.colors.black.card, borderRadius: 12, padding: 4, marginTop: 12 },
  timeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  timeBtnActive: { backgroundColor: theme.colors.gold.subtle },
  timeBtnText: { fontSize: 13, fontWeight: '500', color: theme.colors.grey[500] },
  timeBtnTextActive: { color: theme.colors.gold.primary },

  positionCard: { marginBottom: 16 },
  positionRow: { flexDirection: 'row', marginBottom: 16 },
  positionItem: { flex: 1 },
  positionLabel: { fontSize: 10, color: theme.colors.grey[500], letterSpacing: 1, marginBottom: 4 },
  positionValue: { fontSize: 14, fontWeight: '600', color: theme.colors.white.pure },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', padding: 16, backgroundColor: theme.colors.black.card, borderWidth: 1, borderColor: theme.colors.grey[800], borderRadius: 12 },
  statLabel: { fontSize: 10, color: theme.colors.grey[500], letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: theme.colors.white.pure },

  txLoading: { padding: 20, alignItems: 'center' },
  transactionList: { gap: 10 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: theme.colors.black.card, borderWidth: 1, borderColor: theme.colors.grey[800], borderRadius: 12 },
  transactionIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  transactionIconBuy: { backgroundColor: theme.colors.gold.subtle },
  transactionIconSell: { backgroundColor: 'rgba(255,255,255,0.05)' },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 14, fontWeight: '500', color: theme.colors.white.pure, marginBottom: 2 },
  transactionDate: { fontSize: 12, color: theme.colors.grey[500] },
  transactionValues: { alignItems: 'flex-end' },
  transactionQty: { fontSize: 14, fontWeight: '600', color: theme.colors.white.pure, marginBottom: 2 },
  transactionTotal: { fontSize: 12, color: theme.colors.grey[500] },
  emptyTx: { padding: 24, backgroundColor: theme.colors.black.card, borderWidth: 1, borderColor: theme.colors.grey[800], borderRadius: 12, alignItems: 'center' },
  emptyTxText: { fontSize: 13, color: theme.colors.grey[500] },

  removeSection: { marginTop: 24 },
  removeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12 },
  removeText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
});
