// VAULT - TypeScript Type Definitions

// Enums
export enum Region {
  US = 'US',
  UK = 'UK',
}

export enum Currency {
  USD = 'USD',
  GBP = 'GBP',
}

export enum AssetType {
  STOCK = 'stock',
  ETF = 'etf',
  CRYPTO = 'crypto',
  REIT = 'reit',
  COMMODITY = 'commodity',
  BOND = 'bond',
  CASH = 'cash',
}

export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  DIVIDEND = 'dividend',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
}

export enum TimeRange {
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  THREE_MONTHS = '3M',
  YEAR = '1Y',
  ALL = 'ALL',
}

export enum SyncStatus {
  SYNCED = 'synced',
  SYNCING = 'syncing',
  ERROR = 'error',
  PENDING = 'pending',
}

export enum AccountType {
  BROKERAGE = 'brokerage',
  CRYPTO_EXCHANGE = 'crypto_exchange',
  RETIREMENT = 'retirement',
  MANUAL = 'manual',
}

// Interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  region: Region;
  currency: Currency;
  createdAt: string;
}

export interface Portfolio {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  allTimeGain: number;
  allTimeGainPercent: number;
  totalInvested: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  broker?: string;
  holdings: number;
  lastSynced: string;
  syncStatus: SyncStatus;
  isManual: boolean;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  currentPrice: number;
  avgCost: number;
  accountId: string;
  exchange?: string;
  currency: Currency;
}

export interface HoldingWithMetrics extends Holding {
  value: number;
  dayChange: number;
  dayChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
  allocation: number;
}

export interface Transaction {
  id: string;
  holdingId: string;
  symbol: string;
  name: string;
  type: TransactionType;
  quantity: number;
  price: number;
  total: number;
  date: string;
  accountId: string;
}

export interface Allocation {
  name: string;
  type: AssetType | string;
  value: number;
  percent: number;
  color: string;
}

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface AssetQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  updatedAt: string;
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
  currency: Currency;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  relatedSymbols: string[];
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
}

export interface UserSettings {
  region: Region;
  currency: Currency;
  hideBalances: boolean;
  useBiometrics: boolean;
  pushNotifications: boolean;
  priceAlerts: boolean;
  theme: 'dark' | 'light';
}

// Navigation Types
export type RootStackParamList = {
  '(tabs)': undefined;
  'asset/[id]': { id: string };
  'add-asset': undefined;
  'connect-broker': undefined;
};

export type TabParamList = {
  index: undefined;
  holdings: undefined;
  analysis: undefined;
  settings: undefined;
};

// Broker Lists
export const US_BROKERS = [
  { id: 'robinhood', name: 'Robinhood', type: AccountType.BROKERAGE },
  { id: 'fidelity', name: 'Fidelity', type: AccountType.BROKERAGE },
  { id: 'schwab', name: 'Charles Schwab', type: AccountType.BROKERAGE },
  { id: 'td', name: 'TD Ameritrade', type: AccountType.BROKERAGE },
  { id: 'coinbase', name: 'Coinbase', type: AccountType.CRYPTO_EXCHANGE },
  { id: 'kraken', name: 'Kraken', type: AccountType.CRYPTO_EXCHANGE },
  { id: 'vanguard', name: 'Vanguard', type: AccountType.RETIREMENT },
  { id: 'etrade', name: 'E*TRADE', type: AccountType.BROKERAGE },
];

export const UK_BROKERS = [
  { id: 'trading212', name: 'Trading 212', type: AccountType.BROKERAGE },
  { id: 'freetrade', name: 'Freetrade', type: AccountType.BROKERAGE },
  { id: 'hl', name: 'Hargreaves Lansdown', type: AccountType.BROKERAGE },
  { id: 'ii', name: 'Interactive Investor', type: AccountType.BROKERAGE },
  { id: 'etoro', name: 'eToro', type: AccountType.BROKERAGE },
  { id: 'ajbell', name: 'AJ Bell', type: AccountType.BROKERAGE },
  { id: 'revolut', name: 'Revolut', type: AccountType.CRYPTO_EXCHANGE },
];
