// VAULT - Risk Analysis Screen (DYNAMIC)
// Uses real portfolio data from HoldingsContext

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { Icons } from '../../components/ui';
import { useHoldings } from '../../context/HoldingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Format utilities
const formatCurrency = (value: number, compact = false): string => {
  if (value === null || value === undefined) return 'N/A';
  if (compact && Math.abs(value) >= 1000) {
    return (value < 0 ? '-' : '') + '$' + (Math.abs(value) / 1000).toFixed(1) + 'k';
  }
  return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (value: number): string => {
  return value.toFixed(1) + '%';
};

// Risk level colors
const getRiskColor = (score: number) => {
  if (score <= 30) return '#22C55E'; // Green - Low
  if (score <= 50) return '#EAB308'; // Yellow - Moderate  
  if (score <= 70) return '#F97316'; // Orange - High
  return '#EF4444'; // Red - Very High
};

const getRiskLabel = (score: number) => {
  if (score <= 30) return 'Low Risk';
  if (score <= 50) return 'Moderate';
  if (score <= 70) return 'High Risk';
  return 'Very High';
};

// Speedometer Component
const RiskSpeedometer = ({ score }: { score: number }) => {
  const size = SCREEN_WIDTH - 80;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Arc goes from 135deg to 405deg (270deg sweep)
  const startAngle = 135;
  const endAngle = 405;
  const sweepAngle = 270;
  
  // Calculate needle position
  const needleAngle = startAngle + (score / 100) * sweepAngle;
  const needleRadians = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 30;
  const needleX = centerX + needleLength * Math.cos(needleRadians);
  const needleY = centerY + needleLength * Math.sin(needleRadians);
  
  // Create arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };
  
  const createArc = (start: number, end: number) => {
    const startPoint = polarToCartesian(centerX, centerY, radius, start);
    const endPoint = polarToCartesian(centerX, centerY, radius, end);
    const largeArcFlag = end - start <= 180 ? 0 : 1;
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`;
  };
  
  // Score arc
  const scoreEndAngle = startAngle + (score / 100) * sweepAngle;
  
  return (
    <View style={styles.speedometerContainer}>
      <Svg width={size} height={size * 0.7}>
        <Defs>
          <LinearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#22C55E" />
            <Stop offset="33%" stopColor="#EAB308" />
            <Stop offset="66%" stopColor="#F97316" />
            <Stop offset="100%" stopColor="#EF4444" />
          </LinearGradient>
        </Defs>
        
        {/* Background arc */}
        <Path
          d={createArc(startAngle, endAngle)}
          fill="none"
          stroke={theme.colors.grey[800]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Colored arc based on score */}
        <Path
          d={createArc(startAngle, scoreEndAngle)}
          fill="none"
          stroke={getRiskColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick, i) => {
          const angle = startAngle + (tick / 100) * sweepAngle;
          const innerPoint = polarToCartesian(centerX, centerY, radius - strokeWidth / 2 - 5, angle);
          const outerPoint = polarToCartesian(centerX, centerY, radius - strokeWidth / 2 - 15, angle);
          return (
            <Path
              key={i}
              d={`M ${innerPoint.x} ${innerPoint.y} L ${outerPoint.x} ${outerPoint.y}`}
              stroke={theme.colors.grey[600]}
              strokeWidth={2}
            />
          );
        })}
        
        {/* Needle */}
        <G>
          <Circle cx={centerX} cy={centerY} r={12} fill={theme.colors.grey[800]} />
          <Path
            d={`M ${centerX} ${centerY} L ${needleX} ${needleY}`}
            stroke={getRiskColor(score)}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Circle cx={centerX} cy={centerY} r={6} fill={getRiskColor(score)} />
        </G>
        
        {/* Labels */}
        <SvgText x={40} y={size * 0.65} fill={theme.colors.grey[500]} fontSize={12} textAnchor="middle">Low</SvgText>
        <SvgText x={size - 40} y={size * 0.65} fill={theme.colors.grey[500]} fontSize={12} textAnchor="middle">High</SvgText>
      </Svg>
      
      {/* Score display */}
      <View style={styles.scoreDisplay}>
        <Text style={[styles.scoreValue, { color: getRiskColor(score) }]}>{Math.round(score)}</Text>
        <Text style={[styles.scoreLabel, { color: getRiskColor(score) }]}>{getRiskLabel(score)}</Text>
      </View>
    </View>
  );
};

// Risk Factor Card
const RiskFactor = ({ 
  title, 
  value, 
  status, 
  description,
  icon,
}: { 
  title: string; 
  value: string; 
  status: 'good' | 'warning' | 'danger';
  description: string;
  icon: React.ReactNode;
}) => {
  const statusColors = {
    good: '#22C55E',
    warning: '#EAB308',
    danger: '#EF4444',
  };
  
  return (
    <View style={styles.riskFactorCard}>
      <View style={styles.riskFactorHeader}>
        <View style={[styles.riskFactorIcon, { backgroundColor: statusColors[status] + '20' }]}>
          {icon}
        </View>
        <View style={styles.riskFactorTitleContainer}>
          <Text style={styles.riskFactorTitle}>{title}</Text>
          <Text style={[styles.riskFactorValue, { color: statusColors[status] }]}>{value}</Text>
        </View>
      </View>
      <Text style={styles.riskFactorDescription}>{description}</Text>
    </View>
  );
};

// Allocation Bar
const AllocationBar = ({ allocations }: { allocations: { name: string; percent: number; color: string }[] }) => {
  const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
  
  return (
    <View style={styles.allocationContainer}>
      <View style={styles.allocationBar}>
        {allocations.filter(a => a.percent > 0).map((alloc, i) => (
          <View
            key={i}
            style={[
              styles.allocationSegment,
              { 
                width: `${alloc.percent}%`,
                backgroundColor: alloc.color,
                borderTopLeftRadius: i === 0 ? 8 : 0,
                borderBottomLeftRadius: i === 0 ? 8 : 0,
                borderTopRightRadius: i === allocations.filter(a => a.percent > 0).length - 1 ? 8 : 0,
                borderBottomRightRadius: i === allocations.filter(a => a.percent > 0).length - 1 ? 8 : 0,
              }
            ]}
          />
        ))}
      </View>
      <View style={styles.allocationLegend}>
        {allocations.map((alloc, i) => (
          <View key={i} style={styles.allocationLegendItem}>
            <View style={[styles.allocationDot, { backgroundColor: alloc.color }]} />
            <Text style={styles.allocationLegendText}>{alloc.name}</Text>
            <Text style={styles.allocationLegendPercent}>{alloc.percent}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function AnalysisScreen() {
  const { holdings, metrics, allocations } = useHoldings();
  
  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    if (holdings.length === 0) {
      return {
        overallScore: 0,
        concentrationRisk: 0,
        volatilityRisk: 0,
        diversificationScore: 0,
        largestHolding: null,
        cryptoPercent: 0,
        assetCount: 0,
        recommendations: ['Add assets to start analyzing your portfolio risk.'],
      };
    }
    
    const totalValue = metrics.totalValue;
    
    // 1. Concentration Risk - largest holding as % of portfolio
    const sortedByValue = [...holdings].sort((a, b) => b.currentValue - a.currentValue);
    const largestHolding = sortedByValue[0];
    const concentrationPercent = (largestHolding.currentValue / totalValue) * 100;
    
    // Score: 0-30 if <25%, 30-60 if 25-50%, 60-100 if >50%
    let concentrationRisk = 0;
    if (concentrationPercent <= 25) {
      concentrationRisk = (concentrationPercent / 25) * 30;
    } else if (concentrationPercent <= 50) {
      concentrationRisk = 30 + ((concentrationPercent - 25) / 25) * 30;
    } else {
      concentrationRisk = 60 + ((concentrationPercent - 50) / 50) * 40;
    }
    
    // 2. Volatility Risk - based on asset types
    // Crypto = high volatility, stocks = medium, commodities = low-medium, ETFs = low
    const volatilityWeights: Record<string, number> = {
      crypto: 80,
      stock: 40,
      commodity: 30,
      etf: 20,
    };
    
    let weightedVolatility = 0;
    holdings.forEach(h => {
      const weight = h.currentValue / totalValue;
      const typeVolatility = volatilityWeights[h.type] || 50;
      weightedVolatility += weight * typeVolatility;
    });
    
    // 3. Diversification Score - number of assets and type spread
    const assetCount = holdings.length;
    const uniqueTypes = new Set(holdings.map(h => h.type)).size;
    
    // More assets = lower risk (up to a point)
    let diversificationPenalty = 0;
    if (assetCount === 1) diversificationPenalty = 50;
    else if (assetCount === 2) diversificationPenalty = 30;
    else if (assetCount <= 5) diversificationPenalty = 15;
    else if (assetCount <= 10) diversificationPenalty = 5;
    else diversificationPenalty = 0;
    
    // Fewer types = higher risk
    if (uniqueTypes === 1) diversificationPenalty += 20;
    else if (uniqueTypes === 2) diversificationPenalty += 10;
    
    // Calculate crypto percentage
    const cryptoValue = holdings.filter(h => h.type === 'crypto').reduce((sum, h) => sum + h.currentValue, 0);
    const cryptoPercent = (cryptoValue / totalValue) * 100;
    
    // Overall risk score (0-100)
    const overallScore = Math.min(100, Math.round(
      (concentrationRisk * 0.35) + 
      (weightedVolatility * 0.4) + 
      (diversificationPenalty * 0.25)
    ));
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (concentrationPercent > 50) {
      recommendations.push(`${largestHolding.symbol} represents ${formatPercent(concentrationPercent)} of your portfolio. Consider diversifying.`);
    } else if (concentrationPercent > 30) {
      recommendations.push(`Your largest holding (${largestHolding.symbol}) is ${formatPercent(concentrationPercent)} of portfolio.`);
    }
    
    if (cryptoPercent > 50) {
      recommendations.push(`High crypto exposure (${formatPercent(cryptoPercent)}). Consider adding more stable assets.`);
    }
    
    if (assetCount < 5) {
      recommendations.push('Adding more assets could improve diversification.');
    }
    
    if (uniqueTypes < 3) {
      recommendations.push('Consider diversifying across more asset types (stocks, ETFs, commodities).');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Your portfolio appears well-balanced. Keep monitoring regularly.');
    }
    
    return {
      overallScore,
      concentrationRisk: Math.round(concentrationRisk),
      volatilityRisk: Math.round(weightedVolatility),
      diversificationScore: 100 - diversificationPenalty,
      largestHolding,
      cryptoPercent,
      assetCount,
      recommendations,
    };
  }, [holdings, metrics]);
  
  // Get top gainers and losers
  const sortedByChange = useMemo(() => {
    if (holdings.length === 0) return { gainers: [], losers: [] };
    const sorted = [...holdings].sort((a, b) => b.dayChangePercent - a.dayChangePercent);
    return {
      gainers: sorted.filter(h => h.dayChangePercent > 0).slice(0, 3),
      losers: sorted.filter(h => h.dayChangePercent < 0).slice(0, 3),
    };
  }, [holdings]);
  
  const isEmpty = holdings.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Risk Analysis</Text>
          <TouchableOpacity style={styles.infoButton}>
            <Icons.Shield color={theme.colors.grey[400]} size={20} />
          </TouchableOpacity>
        </Animated.View>

        {isEmpty ? (
          /* Empty State */
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <Icons.Shield color={theme.colors.grey[600]} size={64} />
            <Text style={styles.emptyTitle}>No Portfolio Data</Text>
            <Text style={styles.emptyText}>Add assets to your portfolio to see risk analysis.</Text>
          </Animated.View>
        ) : (
          <>
            {/* Risk Speedometer */}
            <Animated.View entering={FadeInUp.delay(200)}>
              <RiskSpeedometer score={riskMetrics.overallScore} />
            </Animated.View>

            {/* Quick Stats */}
            <Animated.View entering={FadeInUp.delay(300)} style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{riskMetrics.assetCount}</Text>
                <Text style={styles.quickStatLabel}>Assets</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{formatPercent(riskMetrics.cryptoPercent)}</Text>
                <Text style={styles.quickStatLabel}>Crypto</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{riskMetrics.diversificationScore}</Text>
                <Text style={styles.quickStatLabel}>Diversity</Text>
              </View>
            </Animated.View>

            {/* Allocation */}
            <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
              <Text style={styles.sectionTitle}>Asset Allocation</Text>
              <AllocationBar allocations={allocations} />
            </Animated.View>

            {/* Risk Factors */}
            <Animated.View entering={FadeInUp.delay(500)} style={styles.section}>
              <Text style={styles.sectionTitle}>Risk Factors</Text>
              
              <RiskFactor
                title="Concentration"
                value={riskMetrics.largestHolding ? `${formatPercent((riskMetrics.largestHolding.currentValue / metrics.totalValue) * 100)} in ${riskMetrics.largestHolding.symbol}` : 'N/A'}
                status={riskMetrics.concentrationRisk < 30 ? 'good' : riskMetrics.concentrationRisk < 60 ? 'warning' : 'danger'}
                description="How much of your portfolio is in a single asset"
                icon={<Icons.TrendUp color={riskMetrics.concentrationRisk < 30 ? '#22C55E' : riskMetrics.concentrationRisk < 60 ? '#EAB308' : '#EF4444'} size={18} />}
              />
              
              <RiskFactor
                title="Volatility Exposure"
                value={riskMetrics.volatilityRisk < 40 ? 'Low' : riskMetrics.volatilityRisk < 60 ? 'Medium' : 'High'}
                status={riskMetrics.volatilityRisk < 40 ? 'good' : riskMetrics.volatilityRisk < 60 ? 'warning' : 'danger'}
                description="Based on your mix of crypto, stocks, and stable assets"
                icon={<Icons.Stats color={riskMetrics.volatilityRisk < 40 ? '#22C55E' : riskMetrics.volatilityRisk < 60 ? '#EAB308' : '#EF4444'} size={18} />}
              />
              
              <RiskFactor
                title="Diversification"
                value={`${riskMetrics.diversificationScore}/100`}
                status={riskMetrics.diversificationScore > 70 ? 'good' : riskMetrics.diversificationScore > 40 ? 'warning' : 'danger'}
                description="Number of assets and variety of asset types"
                icon={<Icons.Shield color={riskMetrics.diversificationScore > 70 ? '#22C55E' : riskMetrics.diversificationScore > 40 ? '#EAB308' : '#EF4444'} size={18} />}
              />
            </Animated.View>

            {/* Top Movers */}
            {(sortedByChange.gainers.length > 0 || sortedByChange.losers.length > 0) && (
              <Animated.View entering={FadeInUp.delay(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Movers</Text>
                
                <View style={styles.moversContainer}>
                  {/* Gainers */}
                  <View style={styles.moverColumn}>
                    <Text style={styles.moverColumnTitle}>📈 Gainers</Text>
                    {sortedByChange.gainers.length === 0 ? (
                      <Text style={styles.noMovers}>No gainers today</Text>
                    ) : (
                      sortedByChange.gainers.map((h, i) => (
                        <View key={h.id} style={styles.moverItem}>
                          <Text style={styles.moverSymbol}>{h.symbol}</Text>
                          <Text style={styles.moverGain}>+{h.dayChangePercent.toFixed(2)}%</Text>
                        </View>
                      ))
                    )}
                  </View>
                  
                  {/* Losers */}
                  <View style={styles.moverColumn}>
                    <Text style={styles.moverColumnTitle}>📉 Losers</Text>
                    {sortedByChange.losers.length === 0 ? (
                      <Text style={styles.noMovers}>No losers today</Text>
                    ) : (
                      sortedByChange.losers.map((h, i) => (
                        <View key={h.id} style={styles.moverItem}>
                          <Text style={styles.moverSymbol}>{h.symbol}</Text>
                          <Text style={styles.moverLoss}>{h.dayChangePercent.toFixed(2)}%</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Recommendations */}
            <Animated.View entering={FadeInUp.delay(700)} style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Recommendations</Text>
              <View style={styles.recommendationsCard}>
                {riskMetrics.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recommendationItem}>
                    <View style={styles.recommendationBullet} />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Portfolio Summary */}
            <Animated.View entering={FadeInUp.delay(800)} style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
                <Text style={styles.summaryValue}>{formatCurrency(metrics.totalValue)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Invested</Text>
                <Text style={styles.summaryValue}>{formatCurrency(metrics.totalCost)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>All-Time P/L</Text>
                <Text style={[styles.summaryValue, { color: metrics.totalGain >= 0 ? theme.colors.gold.primary : '#EF4444' }]}>
                  {metrics.totalGain >= 0 ? '+' : ''}{formatCurrency(metrics.totalGain)} ({formatPercent(metrics.totalGainPercent)})
                </Text>
              </View>
            </Animated.View>
          </>
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
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.grey[500],
    textAlign: 'center',
  },
  speedometerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginTop: -60,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: theme.colors.black.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: theme.colors.grey[800],
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white.pure,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 16,
  },
  allocationContainer: {
    backgroundColor: theme.colors.black.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
  },
  allocationBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  allocationSegment: {
    height: '100%',
  },
  allocationLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allocationLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocationLegendText: {
    fontSize: 13,
    color: theme.colors.grey[400],
  },
  allocationLegendPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  riskFactorCard: {
    backgroundColor: theme.colors.black.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
  },
  riskFactorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskFactorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riskFactorTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskFactorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  riskFactorValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskFactorDescription: {
    fontSize: 13,
    color: theme.colors.grey[500],
    marginLeft: 48,
  },
  moversContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  moverColumn: {
    flex: 1,
    backgroundColor: theme.colors.black.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
  },
  moverColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 12,
  },
  moverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey[900],
  },
  moverSymbol: {
    fontSize: 14,
    color: theme.colors.white.pure,
  },
  moverGain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  moverLoss: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  noMovers: {
    fontSize: 13,
    color: theme.colors.grey[500],
    fontStyle: 'italic',
  },
  recommendationsCard: {
    backgroundColor: theme.colors.black.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.gold.dark,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.gold.primary,
    marginTop: 6,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.grey[300],
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: theme.colors.black.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey[900],
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.grey[500],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
});
