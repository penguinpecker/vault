// VAULT - API Configuration & Types

export const API_CONFIG = {
  ALPHA_VANTAGE: {
    BASE_URL: 'https://www.alphavantage.co/query',
    API_KEY: '97OCDTKSYVXEKGMK',
    DAILY_LIMIT: 25,
  },
  COINGECKO: {
    BASE_URL: 'https://api.coingecko.com/api/v3',
    RATE_LIMIT_PER_MIN: 30,
  },
  EXCHANGE_RATE: {
    BASE_URL: 'https://open.er-api.com/v6/latest',
  },
};

export type AssetType = 'stock' | 'etf' | 'crypto' | 'commodity';
export type Currency = 'USD' | 'GBP';

export interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  region?: string;
  currency?: Currency;
  image?: string;
}

export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  volume?: number;
  lastUpdated: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface ExchangeRates {
  base: Currency;
  rates: Record<string, number>;
  lastUpdated: string;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  purchaseDate?: string;
  currency: Currency;
  apiId?: string;
  currentPrice?: number;
  priceChange24h?: number;
  lastUpdated?: string;
}

export interface HoldingWithMetrics extends Holding {
  currentValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  allocation: number;
}

export const COMMODITIES: SearchResult[] = [
  { id: 'XAU', symbol: 'XAU', name: 'Gold', type: 'commodity', currency: 'USD' },
  { id: 'XAG', symbol: 'XAG', name: 'Silver', type: 'commodity', currency: 'USD' },
  { id: 'XPT', symbol: 'XPT', name: 'Platinum', type: 'commodity', currency: 'USD' },
  { id: 'XPD', symbol: 'XPD', name: 'Palladium', type: 'commodity', currency: 'USD' },
];

export const CACHE_DURATION = {
  SEARCH: 24 * 60 * 60 * 1000,
  PRICE: 5 * 60 * 1000,
  HISTORICAL: 60 * 60 * 1000,
  EXCHANGE_RATE: 60 * 60 * 1000,
};
