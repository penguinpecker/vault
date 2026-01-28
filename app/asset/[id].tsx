// VAULT - Asset Detail Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { theme } from '../../constants/theme';
import { Icons, Card, SectionHeader, Badge, Button } from '../../components/ui';
import {
  mockHoldings,
  mockTransactions,
  mockChartData,
  formatCurrency,
  formatPercent,
  getRelativeTime,
} from '../../data/mockData';
import { TimeRange } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 160;

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TimeRange.MONTH);
  const [isFavorite, setIsFavorite] = useState(false);

  // Find the asset
  const asset = mockHoldings.find((h) => h.id === id);

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

  const timeRanges: TimeRange[] = [
    TimeRange.DAY,
    TimeRange.WEEK,
    TimeRange.MONTH,
    TimeRange.THREE_MONTHS,
    TimeRange.YEAR,
    TimeRange.ALL,
  ];

  const chartData = mockChartData[selectedRange];
  const assetTransactions = mockTransactions.filter((tx) => tx.symbol === asset.symbol);
  const pricePerUnit = asset.value / asset.quantity;
  const avgCost = asset.value / asset.quantity / (1 + asset.totalGainPercent / 100);

  // Generate SVG path
  const generatePath = () => {
    if (!chartData || chartData.length === 0) return '';

    const minValue = Math.min(...chartData.map((d) => d.value));
    const maxValue = Math.max(...chartData.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const points = chartData.map((point, i) => {
      const x = (i / (chartData.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((point.value - minValue) / range) * (CHART_HEIGHT - 20) - 10;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const generateAreaPath = () => {
    const linePath = generatePath();
    if (!linePath) return '';
    return `${linePath} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;
  };

  const isPositive = asset.dayChangePercent >= 0;

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
          <TouchableOpacity style={styles.starBtn} onPress={() => setIsFavorite(!isFavorite)}>
            {isFavorite ? (
              <Icons.StarFilled color={theme.colors.gold.primary} size={24} />
            ) : (
              <Icons.Star color={theme.colors.grey[400]} size={24} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Price Section */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.priceSection}>
          <Text style={styles.assetName}>{asset.name}</Text>
          <Text style={styles.currentPrice}>{formatCurrency(pricePerUnit)}</Text>
          <View style={styles.priceChangeRow}>
            {isPositive ? (
              <Icons.TrendUp color={theme.colors.gold.primary} size={16} />
            ) : (
              <Icons.TrendDown color={theme.colors.grey[500]} size={16} />
            )}
            <Text
              style={[
                styles.priceChange,
                { color: isPositive ? theme.colors.gold.primary : theme.colors.grey[500] },
              ]}
            >
              {formatPercent(asset.dayChangePercent)}
            </Text>
            <Text style={styles.pricePeriod}>{selectedRange}</Text>
          </View>
        </Animated.View>

        {/* Chart */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.chartContainer}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <SvgGradient id="assetAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop
                  offset="0%"
                  stopColor={isPositive ? theme.colors.gold.primary : theme.colors.grey[500]}
                  stopOpacity={0.3}
                />
                <Stop
                  offset="100%"
                  stopColor={isPositive ? theme.colors.gold.primary : theme.colors.grey[500]}
                  stopOpacity={0}
                />
              </SvgGradient>
            </Defs>

            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <Line
                key={i}
                x1={0}
                y1={(i * CHART_HEIGHT) / 4}
                x2={CHART_WIDTH}
                y2={(i * CHART_HEIGHT) / 4}
                stroke={theme.colors.grey[900]}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            ))}

            {/* Area fill */}
            <Path d={generateAreaPath()} fill="url(#assetAreaGrad)" />

            {/* Line */}
            <Path
              d={generatePath()}
              fill="none"
              stroke={isPositive ? theme.colors.gold.primary : theme.colors.grey[500]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* End point */}
            <Circle
              cx={CHART_WIDTH}
              cy={20}
              r={4}
              fill={isPositive ? theme.colors.gold.primary : theme.colors.grey[500]}
            />
          </Svg>

          <View style={styles.timeRanges}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.timeBtn, selectedRange === range && styles.timeBtnActive]}
                onPress={() => setSelectedRange(range)}
              >
                <Text
                  style={[styles.timeBtnText, selectedRange === range && styles.timeBtnTextActive]}
                >
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
                <Text style={styles.positionValue}>{formatCurrency(avgCost)}</Text>
              </View>
            </View>
            <View style={styles.positionRow}>
              <View style={styles.positionItem}>
                <Text style={styles.positionLabel}>TOTAL VALUE</Text>
                <Text style={styles.positionValue}>{formatCurrency(asset.value)}</Text>
              </View>
              <View style={styles.positionItem}>
                <Text style={styles.positionLabel}>TOTAL P/L</Text>
                <Text
                  style={[
                    styles.positionValue,
                    {
                      color:
                        asset.totalGain >= 0 ? theme.colors.gold.primary : theme.colors.grey[500],
                    },
                  ]}
                >
                  {asset.totalGain >= 0 ? '+' : ''}
                  {formatCurrency(asset.totalGain)} ({formatPercent(asset.totalGainPercent)})
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.actionButtons}>
          <TouchableOpacity style={styles.buyBtn}>
            <LinearGradient
              colors={[theme.colors.gold.dark, theme.colors.gold.primary, theme.colors.gold.light]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buyBtnGradient}
            >
              <Icons.Plus color={theme.colors.black.pure} size={16} />
              <Text style={styles.buyBtnText}>Buy</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellBtn}>
            <Icons.ArrowUp color={theme.colors.grey[300]} size={16} />
            <Text style={styles.sellBtnText}>Sell</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Key Statistics */}
        <Animated.View entering={FadeInUp.duration(600).delay(500)}>
          <SectionHeader title="Key Statistics" />
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DAY CHANGE</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      asset.dayChangePercent >= 0
                        ? theme.colors.gold.primary
                        : theme.colors.grey[500],
                  },
                ]}
              >
                {formatPercent(asset.dayChangePercent)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALLOCATION</Text>
              <Text style={styles.statValue}>{asset.allocation}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>EXCHANGE</Text>
              <Text style={styles.statValue}>{asset.exchange || 'N/A'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>CURRENCY</Text>
              <Text style={styles.statValue}>{asset.currency}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Transaction History */}
        {assetTransactions.length > 0 && (
          <Animated.View entering={FadeInUp.duration(600).delay(600)}>
            <SectionHeader title="Transaction History" />
            <View style={styles.transactionList}>
              {assetTransactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View
                    style={[
                      styles.transactionIcon,
                      tx.type === 'buy' || tx.type === 'dividend'
                        ? styles.transactionIconBuy
                        : styles.transactionIconSell,
                    ]}
                  >
                    {tx.type === 'buy' ? (
                      <Icons.ArrowDown color={theme.colors.gold.primary} size={14} />
                    ) : tx.type === 'sell' ? (
                      <Icons.ArrowUp color={theme.colors.grey[300]} size={14} />
                    ) : (
                      <Icons.Dollar color={theme.colors.gold.primary} size={14} />
                    )}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                      {tx.type === 'buy' ? 'Bought' : tx.type === 'sell' ? 'Sold' : 'Dividend'}
                    </Text>
                    <Text style={styles.transactionDate}>{getRelativeTime(tx.date)}</Text>
                  </View>
                  <View style={styles.transactionValues}>
                    <Text style={styles.transactionQty}>
                      {tx.type !== 'dividend' && (tx.type === 'buy' ? '+' : '-')}
                      {tx.quantity}
                    </Text>
                    <Text style={styles.transactionTotal}>{formatCurrency(tx.total)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: theme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.white.pure,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white.pure,
  },
  starBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Price Section
  priceSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  assetName: {
    fontSize: 14,
    color: theme.colors.grey[400],
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.white.pure,
    marginBottom: 8,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  pricePeriod: {
    fontSize: 12,
    color: theme.colors.grey[600],
  },

  // Chart
  chartContainer: {
    marginBottom: theme.spacing.xl,
  },
  timeRanges: {
    flexDirection: 'row',
    backgroundColor: theme.colors.black.card,
    borderRadius: 12,
    padding: 4,
    marginTop: theme.spacing.lg,
  },
  timeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeBtnActive: {
    backgroundColor: theme.colors.gold.subtle,
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.grey[500],
  },
  timeBtnTextActive: {
    color: theme.colors.gold.primary,
  },

  // Position
  positionCard: {
    marginBottom: theme.spacing.lg,
  },
  positionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  positionItem: {
    flex: 1,
  },
  positionLabel: {
    fontSize: 10,
    color: theme.colors.grey[500],
    letterSpacing: 1,
    marginBottom: 4,
  },
  positionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  buyBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.black.pure,
  },
  sellBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
  },
  sellBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.grey[300],
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.grey[500],
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },

  // Transactions
  transactionList: {
    gap: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconBuy: {
    backgroundColor: theme.colors.gold.subtle,
  },
  transactionIconSell: {
    backgroundColor: theme.colors.white[5],
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  transactionValues: {
    alignItems: 'flex-end',
  },
  transactionQty: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  transactionTotal: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
});
