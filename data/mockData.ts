// VAULT - Mock Data for Development

import {
  Portfolio,
  HoldingWithMetrics,
  Account,
  Transaction,
  Allocation,
  ChartDataPoint,
  AssetType,
  TransactionType,
  AccountType,
  SyncStatus,
  Currency,
  TimeRange,
} from '../types';

// Portfolio Summary
export const mockPortfolio: Portfolio = {
  totalValue: 284739.42,
  dayChange: 4231.87,
  dayChangePercent: 1.51,
  weekChange: 12420.33,
  weekChangePercent: 4.56,
  monthChange: 28450.12,
  monthChangePercent: 11.08,
  allTimeGain: 84739.42,
  allTimeGainPercent: 42.37,
  totalInvested: 200000,
};

// Allocations
export const mockAllocations: Allocation[] = [
  { name: 'Crypto', type: 'crypto', value: 128132, percent: 45, color: '#D4AF37' },
  { name: 'Stocks', type: 'stock', value: 85421, percent: 30, color: '#C0C0C0' },
  { name: 'Real Estate', type: 'reit', value: 42710, percent: 15, color: '#B87333' },
  { name: 'Commodities', type: 'commodity', value: 28473, percent: 10, color: '#B5A642' },
];

// Holdings with full metrics
export const mockHoldings: HoldingWithMetrics[] = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: AssetType.CRYPTO,
    quantity: 0.847,
    currentPrice: 105600,
    avgCost: 45000,
    value: 89443,
    dayChange: 2254,
    dayChangePercent: 2.52,
    totalGain: 51328,
    totalGainPercent: 134.67,
    allocation: 31.4,
    accountId: '1',
    currency: Currency.USD,
    exchange: 'Coinbase',
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    type: AssetType.CRYPTO,
    quantity: 18.4,
    currentPrice: 3654,
    avgCost: 2200,
    value: 67234,
    dayChange: 1197,
    dayChangePercent: 1.78,
    totalGain: 26754,
    totalGainPercent: 66.08,
    allocation: 23.6,
    accountId: '1',
    currency: Currency.USD,
    exchange: 'Coinbase',
  },
  {
    id: '3',
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    type: AssetType.ETF,
    quantity: 112,
    currentPrice: 465,
    avgCost: 380,
    value: 52080,
    dayChange: 338,
    dayChangePercent: 0.65,
    totalGain: 9520,
    totalGainPercent: 22.37,
    allocation: 18.3,
    accountId: '2',
    currency: Currency.USD,
    exchange: 'NYSE',
  },
  {
    id: '4',
    symbol: 'SOL',
    name: 'Solana',
    type: AssetType.CRYPTO,
    quantity: 142,
    currentPrice: 241,
    avgCost: 85,
    value: 34222,
    dayChange: -421,
    dayChangePercent: -1.23,
    totalGain: 22152,
    totalGainPercent: 183.53,
    allocation: 12.0,
    accountId: '1',
    currency: Currency.USD,
    exchange: 'Coinbase',
  },
  {
    id: '5',
    symbol: 'GLD',
    name: 'SPDR Gold Shares',
    type: AssetType.COMMODITY,
    quantity: 145,
    currentPrice: 196,
    avgCost: 175,
    value: 28420,
    dayChange: 145,
    dayChangePercent: 0.51,
    totalGain: 3045,
    totalGainPercent: 12.0,
    allocation: 10.0,
    accountId: '3',
    currency: Currency.USD,
    exchange: 'NYSE',
  },
  {
    id: '6',
    symbol: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    type: AssetType.REIT,
    quantity: 480,
    currentPrice: 89,
    avgCost: 78,
    value: 42720,
    dayChange: 214,
    dayChangePercent: 0.50,
    totalGain: 5280,
    totalGainPercent: 14.10,
    allocation: 15.0,
    accountId: '3',
    currency: Currency.USD,
    exchange: 'NYSE',
  },
  {
    id: '7',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: AssetType.STOCK,
    quantity: 50,
    currentPrice: 185,
    avgCost: 150,
    value: 9250,
    dayChange: 101,
    dayChangePercent: 1.09,
    totalGain: 1750,
    totalGainPercent: 23.33,
    allocation: 3.2,
    accountId: '2',
    currency: Currency.USD,
    exchange: 'NASDAQ',
  },
  {
    id: '8',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: AssetType.STOCK,
    quantity: 25,
    currentPrice: 420,
    avgCost: 280,
    value: 10500,
    dayChange: 126,
    dayChangePercent: 1.2,
    totalGain: 3500,
    totalGainPercent: 50.0,
    allocation: 3.7,
    accountId: '2',
    currency: Currency.USD,
    exchange: 'NASDAQ',
  },
  {
    id: '9',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: AssetType.STOCK,
    quantity: 15,
    currentPrice: 875,
    avgCost: 450,
    value: 13125,
    dayChange: 228,
    dayChangePercent: 1.74,
    totalGain: 6375,
    totalGainPercent: 94.44,
    allocation: 4.6,
    accountId: '2',
    currency: Currency.USD,
    exchange: 'NASDAQ',
  },
  {
    id: '10',
    symbol: 'LINK',
    name: 'Chainlink',
    type: AssetType.CRYPTO,
    quantity: 450,
    currentPrice: 18.5,
    avgCost: 12,
    value: 8325,
    dayChange: 166,
    dayChangePercent: 2.0,
    totalGain: 2925,
    totalGainPercent: 54.17,
    allocation: 2.9,
    accountId: '1',
    currency: Currency.USD,
    exchange: 'Coinbase',
  },
];

// Connected Accounts
export const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Coinbase',
    type: AccountType.CRYPTO_EXCHANGE,
    broker: 'coinbase',
    holdings: 4,
    lastSynced: '30m ago',
    syncStatus: SyncStatus.SYNCED,
    isManual: false,
  },
  {
    id: '2',
    name: 'Fidelity',
    type: AccountType.BROKERAGE,
    broker: 'fidelity',
    holdings: 5,
    lastSynced: '2h ago',
    syncStatus: SyncStatus.SYNCED,
    isManual: false,
  },
  {
    id: '3',
    name: 'Vanguard',
    type: AccountType.RETIREMENT,
    broker: 'vanguard',
    holdings: 3,
    lastSynced: '1d ago',
    syncStatus: SyncStatus.SYNCED,
    isManual: false,
  },
  {
    id: '4',
    name: 'Manual',
    type: AccountType.MANUAL,
    holdings: 1,
    lastSynced: '7d ago',
    syncStatus: SyncStatus.SYNCED,
    isManual: true,
  },
];

// Recent Transactions
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    holdingId: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: TransactionType.BUY,
    quantity: 0.05,
    price: 104500,
    total: 5225,
    date: '2026-01-27T10:30:00Z',
    accountId: '1',
  },
  {
    id: '2',
    holdingId: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    type: TransactionType.SELL,
    quantity: 2.0,
    price: 3600,
    total: 7200,
    date: '2026-01-26T15:45:00Z',
    accountId: '1',
  },
  {
    id: '3',
    holdingId: '3',
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    type: TransactionType.DIVIDEND,
    quantity: 0,
    price: 0,
    total: 124.50,
    date: '2026-01-24T09:00:00Z',
    accountId: '2',
  },
  {
    id: '4',
    holdingId: '7',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: TransactionType.BUY,
    quantity: 10,
    price: 182,
    total: 1820,
    date: '2026-01-22T14:20:00Z',
    accountId: '2',
  },
  {
    id: '5',
    holdingId: '9',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: TransactionType.BUY,
    quantity: 5,
    price: 850,
    total: 4250,
    date: '2026-01-20T11:00:00Z',
    accountId: '2',
  },
];

// Generate chart data
export const generateChartData = (
  range: TimeRange,
  baseValue: number = 284739.42
): ChartDataPoint[] => {
  const points: ChartDataPoint[] = [];
  const now = Date.now();
  
  let numPoints: number;
  let interval: number;
  let volatility: number;
  
  switch (range) {
    case TimeRange.DAY:
      numPoints = 24;
      interval = 60 * 60 * 1000; // 1 hour
      volatility = 0.005;
      break;
    case TimeRange.WEEK:
      numPoints = 7;
      interval = 24 * 60 * 60 * 1000; // 1 day
      volatility = 0.015;
      break;
    case TimeRange.MONTH:
      numPoints = 30;
      interval = 24 * 60 * 60 * 1000;
      volatility = 0.025;
      break;
    case TimeRange.THREE_MONTHS:
      numPoints = 90;
      interval = 24 * 60 * 60 * 1000;
      volatility = 0.04;
      break;
    case TimeRange.YEAR:
      numPoints = 52;
      interval = 7 * 24 * 60 * 60 * 1000; // 1 week
      volatility = 0.08;
      break;
    case TimeRange.ALL:
      numPoints = 100;
      interval = 30 * 24 * 60 * 60 * 1000; // 1 month
      volatility = 0.15;
      break;
    default:
      numPoints = 30;
      interval = 24 * 60 * 60 * 1000;
      volatility = 0.025;
  }
  
  let value = baseValue * (1 - volatility * 2);
  
  for (let i = 0; i < numPoints; i++) {
    const change = (Math.random() - 0.45) * baseValue * volatility;
    value = Math.max(value + change, baseValue * 0.7);
    value = Math.min(value, baseValue * 1.1);
    
    points.push({
      timestamp: now - (numPoints - i) * interval,
      value: i === numPoints - 1 ? baseValue : value,
    });
  }
  
  return points;
};

// Pre-generated chart data for each range
export const mockChartData: Record<TimeRange, ChartDataPoint[]> = {
  [TimeRange.DAY]: generateChartData(TimeRange.DAY),
  [TimeRange.WEEK]: generateChartData(TimeRange.WEEK),
  [TimeRange.MONTH]: generateChartData(TimeRange.MONTH),
  [TimeRange.THREE_MONTHS]: generateChartData(TimeRange.THREE_MONTHS),
  [TimeRange.YEAR]: generateChartData(TimeRange.YEAR),
  [TimeRange.ALL]: generateChartData(TimeRange.ALL),
};

// Helper Functions
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const formatCurrency = (
  value: number,
  currency: Currency = Currency.USD,
  compact: boolean = false
): string => {
  if (compact && Math.abs(value) >= 1000) {
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    }
    return `${sign}$${(absValue / 1000).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number, showSign: boolean = true): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};
