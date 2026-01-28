// VAULT - Risk Analysis Screen
// ORIGINAL DESIGN - Now with real data from HoldingsContext

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { theme } from '../../constants/theme';
import { Icons, Card, SectionHeader } from '../../components/ui';
import { useHoldings } from '../../context/HoldingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Format currency helper
const formatCurrency = (value: number, compact = false): string => {
  if (value === null || value === undefined) return 'N/A';
  if (compact && Math.abs(value) >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'k';
  }
  return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function AnalysisScreen() {
  const { holdings, metrics, allocations } = useHoldings();
  
  // Metal colors for easy reference
  const metals = {
    gold: theme.colors.gold,
    silver: theme.colors.silver,
    bronze: theme.colors.bronze,
    copper: theme.colors.copper,
    brass: theme.colors.brass,
  };

  // ============================================
  // RISK ANALYSIS ALGORITHM (NOW USING REAL DATA)
  // ============================================
  const riskAnalysis = useMemo(() => {
    // Handle empty portfolio
    if (holdings.length === 0) {
      return {
        overallRisk: 0,
        riskLevel: 'N/A',
        riskColor: metals.gold,
        breakdown: [
          { label: 'Concentration', score: 0, color: metals.gold },
          { label: 'Asset Risk', score: 0, color: metals.silver },
          { label: 'Diversification', score: 0, color: metals.copper },
          { label: 'Volatility', score: 0, color: metals.brass },
        ],
        recommendations: [{
          type: 'info' as const,
          text: 'No Portfolio Data',
          suggestion: 'Add assets to see your risk analysis',
        }],
        holdingsVolatility: [],
      };
    }

    const totalValue = metrics.totalValue;

    // 1. Concentration Risk (0-100) - based on largest holding percentage
    const sortedByValue = [...holdings].sort((a, b) => b.currentValue - a.currentValue);
    const largestHolding = sortedByValue[0];
    const maxAllocation = (largestHolding.currentValue / totalValue) * 100;
    const concentrationRisk = maxAllocation > 50 ? 90 : maxAllocation > 40 ? 80 : maxAllocation > 30 ? 60 : maxAllocation > 20 ? 40 : 20;

    // 2. Weighted Asset Type Risk
    const typeRiskMap: Record<string, number> = {
      'crypto': 90,
      'stock': 55,
      'etf': 30,
      'commodity': 40,
    };
    
    let weightedTypeRisk = 0;
    holdings.forEach(h => {
      const weight = h.currentValue / totalValue;
      weightedTypeRisk += (typeRiskMap[h.type] || 50) * weight;
    });

    // 3. Diversification Score - number of assets and types
    const numAssets = holdings.length;
    const uniqueTypes = new Set(holdings.map(h => h.type)).size;
    let diversificationRisk = numAssets >= 10 ? 20 : numAssets >= 5 ? 35 : numAssets >= 3 ? 50 : 70;
    if (uniqueTypes === 1) diversificationRisk += 15;
    diversificationRisk = Math.min(100, diversificationRisk);

    // 4. Volatility Risk - based on day changes and asset types
    const avgAbsChange = holdings.reduce((sum, h) => sum + Math.abs(h.dayChangePercent), 0) / holdings.length;
    const volatilityRisk = Math.min(100, Math.round(avgAbsChange * 12 + weightedTypeRisk * 0.4));

    // Overall Risk Score
    const overallRisk = Math.round(
      concentrationRisk * 0.25 +
      weightedTypeRisk * 0.35 +
      diversificationRisk * 0.20 +
      volatilityRisk * 0.20
    );

    // Risk Level
    let riskLevel: string, riskColor: typeof metals.gold;
    if (overallRisk <= 30) {
      riskLevel = 'Conservative';
      riskColor = metals.gold;
    } else if (overallRisk <= 45) {
      riskLevel = 'Moderate-Low';
      riskColor = metals.brass;
    } else if (overallRisk <= 60) {
      riskLevel = 'Moderate';
      riskColor = metals.silver;
    } else if (overallRisk <= 75) {
      riskLevel = 'Aggressive';
      riskColor = metals.copper;
    } else {
      riskLevel = 'Very Aggressive';
      riskColor = metals.bronze;
    }

    // Breakdown - each with different metal color
    const breakdown = [
      { label: 'Concentration', score: Math.round(concentrationRisk), color: metals.gold },
      { label: 'Asset Risk', score: Math.round(weightedTypeRisk), color: metals.silver },
      { label: 'Diversification', score: Math.round(diversificationRisk), color: metals.copper },
      { label: 'Volatility', score: Math.round(volatilityRisk), color: metals.brass },
    ];

    // Recommendations based on real data
    const recommendations: Array<{ type: 'warning' | 'info' | 'success'; text: string; suggestion: string }> = [];
    
    // Check crypto allocation
    const cryptoValue = holdings.filter(h => h.type === 'crypto').reduce((sum, h) => sum + h.currentValue, 0);
    const cryptoPercent = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;
    
    if (cryptoPercent > 40) {
      recommendations.push({
        type: 'warning',
        text: `High Crypto Exposure (${cryptoPercent.toFixed(0)}%)`,
        suggestion: 'Consider reducing to below 40% for stability',
      });
    }
    if (maxAllocation > 40) {
      recommendations.push({
        type: 'warning',
        text: `Concentration Risk in ${largestHolding.symbol}`,
        suggestion: `${maxAllocation.toFixed(0)}% in one asset. Consider rebalancing.`,
      });
    }
    if (uniqueTypes < 3) {
      recommendations.push({
        type: 'info',
        text: 'Limited Diversification',
        suggestion: 'Adding different asset types could reduce risk',
      });
    }
    if (numAssets < 5) {
      recommendations.push({
        type: 'info',
        text: 'Few Holdings',
        suggestion: 'Consider adding more positions to spread risk',
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        text: 'Well-Balanced Portfolio',
        suggestion: 'Your allocation appears well-diversified',
      });
    }

    // Holdings with volatility (calculated from type and day change)
    const holdingsVolatility = holdings.map(h => ({
      ...h,
      volatility: Math.min(1, (typeRiskMap[h.type] || 50) / 100 * 0.6 + Math.abs(h.dayChangePercent) / 15),
    })).sort((a, b) => b.volatility - a.volatility);

    return {
      overallRisk,
      riskLevel,
      riskColor,
      breakdown,
      recommendations,
      holdingsVolatility,
    };
  }, [holdings, metrics, allocations]);

  // Risk Gauge Component (ORIGINAL DESIGN)
  const RiskGauge = () => {
    const angle = (riskAnalysis.overallRisk / 100) * 180 - 90;
    const needleX = 100 + 55 * Math.cos((angle * Math.PI) / 180);
    const needleY = 100 + 55 * Math.sin((angle * Math.PI) / 180);

    return (
      <Svg width={SCREEN_WIDTH - 80} height={140} viewBox="0 0 200 120">
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={metals.gold.primary} />
            <Stop offset="25%" stopColor={metals.brass.primary} />
            <Stop offset="50%" stopColor={metals.silver.primary} />
            <Stop offset="75%" stopColor={metals.copper.primary} />
            <Stop offset="100%" stopColor={metals.bronze.primary} />
          </LinearGradient>
        </Defs>
        
        {/* Background arc */}
        <Path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={theme.colors.grey[900]}
          strokeWidth={14}
          strokeLinecap="round"
        />
        
        {/* Colored arc */}
        <Path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        
        {/* Needle */}
        <Line
          x1={100}
          y1={100}
          x2={needleX}
          y2={needleY}
          stroke={riskAnalysis.riskColor.primary}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx={100} cy={100} r={8} fill={riskAnalysis.riskColor.primary} />
        <Circle cx={100} cy={100} r={4} fill={theme.colors.black.rich} />
        
        {/* Labels */}
        <SvgText x={20} y={115} fill={theme.colors.grey[500]} fontSize={10} textAnchor="middle">Low</SvgText>
        <SvgText x={180} y={115} fill={theme.colors.grey[500]} fontSize={10} textAnchor="middle">High</SvgText>
      </Svg>
    );
  };

  const isEmpty = holdings.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Text style={styles.pageTitle}>Risk Analysis</Text>
        </Animated.View>

        {/* Main Risk Score Card */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <View style={styles.riskIconContainer}>
              <Icons.Shield color={metals.gold.primary} size={20} />
            </View>
            <View style={styles.riskTitleGroup}>
              <Text style={styles.riskTitle}>Portfolio Risk Score</Text>
              <View style={[styles.riskBadge, { backgroundColor: `${riskAnalysis.riskColor.primary}20` }]}>
                <Text style={[styles.riskBadgeText, { color: riskAnalysis.riskColor.primary }]}>
                  {riskAnalysis.riskLevel}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.riskScoreContainer}>
            <Text style={[styles.riskScoreBig, { color: riskAnalysis.riskColor.primary }]}>
              {riskAnalysis.overallRisk}
            </Text>
            <Text style={styles.riskScoreMax}>/100</Text>
          </View>
          
          <View style={styles.gaugeContainer}>
            <RiskGauge />
          </View>
        </Animated.View>

        {/* Risk Breakdown */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)}>
          <SectionHeader title="Risk Breakdown" />
          <Card style={styles.breakdownCard}>
            {riskAnalysis.breakdown.map((item, i) => (
              <View key={i} style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <View style={styles.breakdownBarTrack}>
                  <View
                    style={[
                      styles.breakdownBarFill,
                      { width: `${item.score}%`, backgroundColor: item.color.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.breakdownScore, { color: item.color.primary }]}>
                  {item.score}
                </Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Recommendations */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <SectionHeader title="Recommendations" />
          {riskAnalysis.recommendations.map((rec, i) => (
            <View
              key={i}
              style={[
                styles.recCard,
                {
                  borderLeftColor:
                    rec.type === 'warning' ? metals.copper.primary :
                    rec.type === 'success' ? metals.gold.primary : metals.brass.primary,
                },
              ]}
            >
              <View style={styles.recIcon}>
                {rec.type === 'warning' && <Icons.TrendUp color={metals.copper.primary} size={16} />}
                {rec.type === 'success' && <Icons.Shield color={metals.gold.primary} size={16} />}
                {rec.type === 'info' && <Icons.Stats color={metals.brass.primary} size={16} />}
              </View>
              <View style={styles.recContent}>
                <Text style={styles.recText}>{rec.text}</Text>
                <Text style={styles.recSuggestion}>{rec.suggestion}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Allocation Risk */}
        {!isEmpty && (
          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <SectionHeader title="Allocation Risk" />
            {allocations.filter(a => a.percent > 0).map((alloc, i) => {
              // Map allocation names to risk levels
              const typeRiskLevels: Record<string, { level: string; color: string }> = {
                'Crypto': { level: 'High Risk', color: metals.bronze.primary },
                'Stocks': { level: 'Medium Risk', color: metals.silver.primary },
                'ETFs': { level: 'Low Risk', color: metals.gold.primary },
                'Commodities': { level: 'Medium Risk', color: metals.brass.primary },
              };
              const riskInfo = typeRiskLevels[alloc.name] || { level: 'Medium', color: metals.silver.primary };
              
              return (
                <View key={i} style={styles.allocCard}>
                  <View style={styles.allocHeader}>
                    <View style={[styles.allocDot, { backgroundColor: alloc.color }]} />
                    <Text style={styles.allocName}>{alloc.name}</Text>
                    <Text style={styles.allocPercent}>{alloc.percent}%</Text>
                  </View>
                  <View style={styles.allocBarTrack}>
                    <View
                      style={[styles.allocBarFill, { width: `${alloc.percent}%`, backgroundColor: alloc.color }]}
                    />
                  </View>
                  <View style={styles.allocFooter}>
                    <Text style={styles.allocValue}>{formatCurrency(alloc.value, true)}</Text>
                    <Text style={[styles.allocRisk, { color: riskInfo.color }]}>{riskInfo.level}</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Volatility by Asset */}
        {!isEmpty && riskAnalysis.holdingsVolatility.length > 0 && (
          <Animated.View entering={FadeInUp.duration(600).delay(500)}>
            <SectionHeader title="Volatility by Asset" />
            <Card>
              {riskAnalysis.holdingsVolatility.slice(0, 5).map((h, i) => {
                const volColors = [metals.gold, metals.silver, metals.bronze, metals.copper, metals.brass];
                const color = volColors[i % 5];
                return (
                  <View key={h.id} style={styles.volItem}>
                    <Text style={styles.volSymbol}>{h.symbol}</Text>
                    <View style={styles.volBarTrack}>
                      <View
                        style={[
                          styles.volBarFill,
                          { width: `${h.volatility * 100}%`, backgroundColor: color.primary },
                        ]}
                      />
                    </View>
                    <Text style={[styles.volValue, { color: color.primary }]}>
                      {Math.round(h.volatility * 100)}%
                    </Text>
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
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

  // Header
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white.pure,
  },

  // Risk Card
  riskCard: {
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 20,
    padding: 20,
    marginBottom: theme.spacing.xl,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  riskIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: `${theme.colors.gold.primary}15`,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskTitleGroup: {
    flex: 1,
    gap: 6,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  riskScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  riskScoreBig: {
    fontSize: 56,
    fontWeight: '700',
  },
  riskScoreMax: {
    fontSize: 20,
    color: theme.colors.grey[500],
  },
  gaugeContainer: {
    alignItems: 'center',
  },

  // Breakdown
  breakdownCard: {
    marginBottom: theme.spacing.xl,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  breakdownLabel: {
    width: 100,
    fontSize: 13,
    color: theme.colors.grey[400],
  },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.grey[900],
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownScore: {
    width: 36,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Recommendations
  recCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  recIcon: {
    marginTop: 2,
  },
  recContent: {
    flex: 1,
    gap: 4,
  },
  recText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.white.pure,
  },
  recSuggestion: {
    fontSize: 12,
    color: theme.colors.grey[500],
    lineHeight: 18,
  },

  // Allocation
  allocCard: {
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  allocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  allocDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  allocName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.white.pure,
  },
  allocPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.grey[500],
  },
  allocBarTrack: {
    height: 6,
    backgroundColor: theme.colors.grey[900],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  allocBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  allocFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  allocValue: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  allocRisk: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Volatility
  volItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  volSymbol: {
    width: 50,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  volBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.grey[900],
    borderRadius: 4,
    overflow: 'hidden',
  },
  volBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  volValue: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});