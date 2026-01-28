// VAULT - Portfolio Screen (DESIGN LOCKED)
// Features: Empty states (N/A/$0.00), real data from holdings context

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, Polyline } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { Icons } from '../../components/ui';
import { useHoldings } from '../../context/HoldingsContext';

// Format utilities
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

// Sparkline Component
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

// Radial Chart Component
const RadialChart = ({ allocations, totalValue, showBalance }: { allocations: any[], totalValue: number, showBalance: boolean }) => {
  let rotation = -90;
  const hasData = allocations.some(a => a.percent > 0);
  
  return (
    <View style={styles.chartContainer}>
      <Svg width={180} height={180} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.colors.gold.primary} />
            <Stop offset="50%" stopColor={theme.colors.gold.light} />
            <Stop offset="100%" stopColor={theme.colors.gold.primary} />
          </LinearGradient>
          <LinearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.colors.silver.primary} />
            <Stop offset="50%" stopColor={theme.colors.silver.light} />
            <Stop offset="100%" stopColor={theme.colors.silver.dark} />
          </LinearGradient>
          <LinearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.colors.copper.dark} />
            <Stop offset="50%" stopColor={theme.colors.copper.primary} />
            <Stop offset="100%" stopColor={theme.colors.copper.light} />
          </LinearGradient>
          <LinearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.colors.brass.dark} />
            <Stop offset="50%" stopColor={theme.colors.brass.primary} />
            <Stop offset="100%" stopColor={theme.colors.brass.light} />
          </LinearGradient>
        </Defs>
        
        {/* Guide circles */}
        <Circle cx={100} cy={100} r={85} fill="none" stroke={theme.colors.grey[900]} strokeWidth={1} />
        <Circle cx={100} cy={100} r={70} fill="none" stroke={theme.colors.grey[900]} strokeWidth={1} />
        <Circle cx={100} cy={100} r={55} fill="none" stroke={theme.colors.grey[900]} strokeWidth={1} />
        
        {/* Allocation arcs or empty state */}
        {hasData ? allocations.filter(a => a.percent > 0).map((segment, index) => {
          const radius = 75;
          const circumference = 2 * Math.PI * radius;
          const strokeLength = (segment.percent / 100) * circumference;
          const currentRotation = rotation;
          rotation += (segment.percent / 100) * 360;
          const gradients = ['url(#goldGrad)', 'url(#silverGrad)', 'url(#copperGrad)', 'url(#brassGrad)'];
          
          return (
            <Circle
              key={index}
              cx={100}
              cy={100}
              r={radius}
              fill="none"
              stroke={gradients[index % 4]}
              strokeWidth={12}
              strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
              strokeLinecap="round"
              transform={`rotate(${currentRotation} 100 100)`}
            />
          );
        }) : (
          <Circle
            cx={100}
            cy={100}
            r={75}
            fill="none"
            stroke={theme.colors.grey[800]}
            strokeWidth={12}
            strokeDasharray="4 4"
          />
        )}
        
        {/* Center circle */}
        <Circle cx={100} cy={100} r={50} fill={theme.colors.black.rich} />
        <Circle cx={100} cy={100} r={50} fill="none" stroke={theme.colors.grey[900]} strokeWidth={1} />
      </Svg>
      
      <View style={styles.chartCenter}>
        <Text style={styles.chartLabel}>TOTAL</Text>
        <Text style={styles.chartValue}>
          {totalValue === 0 ? '$0.00' : (showBalance ? formatCurrency(totalValue, true) : '•••••')}
        </Text>
      </View>
    </View>
  );
};

export default function PortfolioScreen() {
  const router = useRouter();
  const { holdings, metrics, allocations } = useHoldings();
  const [showBalance, setShowBalance] = useState(true);
  
  const isEmpty = holdings.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <View style={styles.logoContainer}>
            <ExpoLinearGradient
              colors={[theme.colors.gold.dark, theme.colors.gold.primary, theme.colors.gold.light]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoIcon}>◆</Text>
            </ExpoLinearGradient>
            <Text style={styles.logoText}>VAULT</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Icons.Bell color={theme.colors.grey[400]} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icons.User color={theme.colors.grey[400]} size={20} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.hero}>
          <Text style={styles.heroLabel}>TOTAL PORTFOLIO VALUE</Text>
          <View style={styles.heroValueRow}>
            <Text style={[styles.heroValue, isEmpty && styles.heroValueEmpty]}>
              {isEmpty ? '$0.00' : (showBalance ? formatCurrency(metrics.totalValue) : '$•••,•••.••')}
            </Text>
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowBalance(!showBalance)}
            >
              {showBalance ? (
                <Icons.Eye color={theme.colors.grey[400]} size={18} />
              ) : (
                <Icons.EyeOff color={theme.colors.grey[400]} size={18} />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Performance Pills */}
          <View style={styles.pillsRow}>
            <View style={[styles.pill, isEmpty && styles.pillEmpty]}>
              {!isEmpty && <Icons.TrendUp color={theme.colors.gold.primary} size={14} />}
              <Text style={[styles.pillValue, isEmpty && styles.pillValueEmpty]}>
                {isEmpty ? 'N/A' : formatPercent(metrics.dayChangePercent)}
              </Text>
              <Text style={styles.pillLabel}>Today</Text>
            </View>
            <View style={[styles.pill, isEmpty && styles.pillEmpty]}>
              {!isEmpty && <Icons.TrendUp color={theme.colors.gold.primary} size={14} />}
              <Text style={[styles.pillValue, isEmpty && styles.pillValueEmpty]}>
                {isEmpty ? 'N/A' : formatPercent(metrics.totalGainPercent)}
              </Text>
              <Text style={styles.pillLabel}>All Time</Text>
            </View>
          </View>
        </Animated.View>

        {/* Chart */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <RadialChart 
            allocations={allocations} 
            totalValue={metrics.totalValue} 
            showBalance={showBalance} 
          />
        </Animated.View>

        {/* Allocation Legend */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.legendGrid}>
          {allocations.map((item, index) => (
            <View key={index} style={[styles.legendItem, { borderLeftColor: item.color }]}>
              <View>
                <Text style={styles.legendName}>{item.name}</Text>
                <Text style={styles.legendValue}>
                  {item.value === 0 ? 'N/A' : (showBalance ? formatCurrency(item.value, true) : '•••')}
                </Text>
              </View>
              <Text style={styles.legendPercent}>{item.percent}%</Text>
            </View>
          ))}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/asset/add')}
          >
            <ExpoLinearGradient
              colors={[theme.colors.gold.dark, theme.colors.gold.primary, theme.colors.gold.light]}
              style={styles.addButtonGradient}
            >
              <View style={styles.addButtonIcon}>
                <Icons.Plus color={theme.colors.black.pure} size={18} />
              </View>
              <Text style={styles.addButtonText}>Add</Text>
            </ExpoLinearGradient>
          </TouchableOpacity>
          
          {[
            { icon: <Icons.Shield color={theme.colors.grey[300]} size={18} />, label: 'Risk' },
            { icon: <Icons.Sync color={theme.colors.grey[300]} size={18} />, label: 'Sync' },
            { icon: <Icons.Stats color={theme.colors.grey[300]} size={18} />, label: 'Stats' },
          ].map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionButton}>
              <View style={styles.actionIcon}>{action.icon}</View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Bento Grid */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.bentoGrid}>
          <View style={[styles.bentoItem, !isEmpty && styles.bentoItemHighlight]}>
            <Text style={styles.bentoLabel}>ALL-TIME GAIN</Text>
            <Text style={[styles.bentoValue, !isEmpty && styles.bentoValueGold]}>
              {isEmpty ? 'N/A' : (showBalance ? (metrics.totalGain >= 0 ? '+' : '') + formatCurrency(metrics.totalGain, true) : '•••')}
            </Text>
            <Text style={[styles.bentoSub, !isEmpty && styles.bentoSubGold]}>
              {isEmpty ? 'N/A' : formatPercent(metrics.totalGainPercent)}
            </Text>
          </View>
          <View style={styles.bentoItem}>
            <Text style={styles.bentoLabel}>TODAY</Text>
            <Text style={styles.bentoValue}>
              {isEmpty ? 'N/A' : (showBalance ? (metrics.dayChange >= 0 ? '+' : '') + formatCurrency(metrics.dayChange, true) : '•••')}
            </Text>
            <Text style={[styles.bentoSub, !isEmpty && styles.bentoSubGold]}>
              {isEmpty ? 'N/A' : formatPercent(metrics.dayChangePercent)}
            </Text>
          </View>
          <View style={styles.bentoItem}>
            <Text style={styles.bentoLabel}>ASSETS</Text>
            <Text style={styles.bentoValue}>{holdings.length}</Text>
            <Text style={styles.bentoSub}>Tracked</Text>
          </View>
          <View style={styles.bentoItem}>
            <Text style={styles.bentoLabel}>TOTAL COST</Text>
            <Text style={styles.bentoValue}>
              {isEmpty ? 'N/A' : (showBalance ? formatCurrency(metrics.totalCost, true) : '•••')}
            </Text>
            <Text style={styles.bentoSub}>Invested</Text>
          </View>
        </Animated.View>

        {/* Top Holdings */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.holdingsSection}>
          <View style={styles.holdingsHeader}>
            <Text style={styles.holdingsTitle}>Top Holdings</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/holdings')}>
              <Text style={styles.holdingsSeeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No assets yet</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/asset/add')}
              >
                <ExpoLinearGradient
                  colors={[theme.colors.gold.dark, theme.colors.gold.primary]}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Add Your First Asset</Text>
                </ExpoLinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.holdingsList}>
              {holdings.slice(0, 5).map((holding, index) => {
                const rankColors = [
                  theme.colors.gold.primary,
                  theme.colors.silver.primary,
                  theme.colors.bronze.primary,
                  theme.colors.copper.primary,
                  theme.colors.brass.primary,
                ];
                const positive = holding.dayChangePercent >= 0;
                
                return (
                  <View key={holding.id} style={styles.holdingItem}>
                    <View style={[styles.rankBadge, { backgroundColor: rankColors[index] }]}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.holdingInfo}>
                      <Text style={styles.holdingName}>{holding.name}</Text>
                      <Text style={styles.holdingMeta}>{holding.symbol} · {holding.quantity}</Text>
                    </View>
                    <Sparkline positive={positive} />
                    <View style={styles.holdingValues}>
                      <Text style={styles.holdingValue}>
                        {showBalance ? formatCurrency(holding.currentValue, true) : '•••'}
                      </Text>
                      <Text style={[styles.holdingChange, positive && styles.holdingChangePositive]}>
                        {formatPercent(holding.dayChangePercent)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoGradient: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 18,
    color: theme.colors.black.pure,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    color: theme.colors.white.pure,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 11,
    color: theme.colors.grey[500],
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.white.pure,
  },
  heroValueEmpty: {
    color: theme.colors.grey[600],
  },
  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.gold.subtle,
    borderWidth: 1,
    borderColor: theme.colors.gold.dark,
    borderRadius: 100,
  },
  pillEmpty: {
    backgroundColor: theme.colors.black.card,
    borderColor: theme.colors.grey[800],
  },
  pillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gold.primary,
  },
  pillValueEmpty: {
    color: theme.colors.grey[600],
  },
  pillLabel: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  chartContainer: {
    position: 'relative',
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginBottom: 20,
  },
  chartCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -20 }],
    alignItems: 'center',
    width: 80,
  },
  chartLabel: {
    fontSize: 10,
    color: theme.colors.grey[500],
    letterSpacing: 2,
  },
  chartValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white.pure,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  legendItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  legendName: {
    fontSize: 13,
    color: theme.colors.grey[400],
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  legendPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.grey[500],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  addButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  addButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.black.pure,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    alignItems: 'center',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.grey[900],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  bentoItem: {
    width: '47%',
    padding: 18,
    borderRadius: 16,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
  },
  bentoItemHighlight: {
    borderColor: theme.colors.gold.dark,
  },
  bentoLabel: {
    fontSize: 10,
    color: theme.colors.grey[500],
    letterSpacing: 1,
    marginBottom: 6,
  },
  bentoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  bentoValueGold: {
    color: theme.colors.gold.primary,
  },
  bentoSub: {
    fontSize: 11,
    color: theme.colors.grey[500],
  },
  bentoSubGold: {
    color: theme.colors.gold.primary,
  },
  holdingsSection: {
    marginBottom: 16,
  },
  holdingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  holdingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  holdingsSeeAll: {
    fontSize: 13,
    color: theme.colors.gold.primary,
  },
  emptyState: {
    padding: 40,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.grey[500],
    marginBottom: 12,
  },
  emptyButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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
    gap: 14,
    padding: 14,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 14,
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
  holdingName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  holdingMeta: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  holdingValues: {
    alignItems: 'flex-end',
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  holdingChange: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  holdingChangePositive: {
    color: theme.colors.gold.primary,
  },
});
