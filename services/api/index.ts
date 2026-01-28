// VAULT - Unified API Service
import { SearchResult, PriceData, PricePoint, ExchangeRates, Holding, HoldingWithMetrics, COMMODITIES, CACHE_DURATION, Currency, AssetType } from './config';
import alphaVantage from './alphaVantage';
import coinGecko from './coinGecko';

// Simple cache
const cache: Record<string, { data: any; timestamp: number }> = {};

function getCached<T>(key: string, maxAge: number): T | null {
  const entry = cache[key];
  if (!entry || Date.now() - entry.timestamp > maxAge) return null;
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

export async function searchAssets(query: string, type?: AssetType): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  
  const cacheKey = `search:${type || 'all'}:${query.toLowerCase()}`;
  const cached = getCached<SearchResult[]>(cacheKey, CACHE_DURATION.SEARCH);
  if (cached) return cached;
  
  let results: SearchResult[] = [];
  
  if (!type || type === 'stock' || type === 'etf') {
    results = [...results, ...(await alphaVantage.searchStocks(query))];
  }
  if (!type || type === 'crypto') {
    results = [...results, ...(await coinGecko.searchCrypto(query))];
  }
  if (!type || type === 'commodity') {
    results = [...results, ...COMMODITIES.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.symbol.toLowerCase().includes(query.toLowerCase())
    )];
  }
  
  setCache(cacheKey, results);
  return results;
}

export const searchStocks = alphaVantage.searchStocks;
export const searchCrypto = coinGecko.searchCrypto;
export const getCommodities = () => COMMODITIES;

const COMMODITY_PRICES: Record<string, number> = { XAU: 2050, XAG: 23.5, XPT: 920, XPD: 1050 };

export async function getPrice(holding: Holding): Promise<PriceData | null> {
  const cacheKey = `price:${holding.type}:${holding.apiId || holding.symbol}`;
  const cached = getCached<PriceData>(cacheKey, CACHE_DURATION.PRICE);
  if (cached) return cached;
  
  let priceData: PriceData | null = null;
  
  if (holding.type === 'stock' || holding.type === 'etf') {
    priceData = await alphaVantage.getStockQuote(holding.symbol);
  } else if (holding.type === 'crypto') {
    const prices = await coinGecko.getCryptoPrices([holding.apiId || holding.symbol.toLowerCase()]);
    priceData = prices[holding.apiId || holding.symbol.toLowerCase()] || null;
  } else if (holding.type === 'commodity') {
    const price = COMMODITY_PRICES[holding.symbol];
    if (price) priceData = { price, change: 0, changePercent: 0, lastUpdated: new Date().toISOString() };
  }
  
  if (priceData) setCache(cacheKey, priceData);
  return priceData;
}

export async function getPrices(holdings: Holding[]): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  
  const cryptoHoldings = holdings.filter(h => h.type === 'crypto');
  if (cryptoHoldings.length > 0) {
    const ids = cryptoHoldings.map(h => h.apiId || h.symbol.toLowerCase());
    const prices = await coinGecko.getCryptoPrices(ids);
    cryptoHoldings.forEach(h => {
      const id = h.apiId || h.symbol.toLowerCase();
      if (prices[id]) results[h.id] = prices[id];
    });
  }
  
  for (const h of holdings.filter(h => h.type === 'stock' || h.type === 'etf')) {
    const price = await alphaVantage.getStockQuote(h.symbol);
    if (price) results[h.id] = price;
    await new Promise(r => setTimeout(r, 250));
  }
  
  holdings.filter(h => h.type === 'commodity').forEach(h => {
    const price = COMMODITY_PRICES[h.symbol];
    if (price) results[h.id] = { price, change: 0, changePercent: 0, lastUpdated: new Date().toISOString() };
  });
  
  return results;
}

export async function getExchangeRates(base: Currency = 'USD'): Promise<ExchangeRates> {
  const cacheKey = `exchange:${base}`;
  const cached = getCached<ExchangeRates>(cacheKey, CACHE_DURATION.EXCHANGE_RATE);
  if (cached) return cached;
  
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await response.json();
    const rates = { base, rates: data.rates || {}, lastUpdated: new Date().toISOString() };
    setCache(cacheKey, rates);
    return rates;
  } catch {
    return { base, rates: { USD: 1, GBP: 0.79, EUR: 0.92 }, lastUpdated: new Date().toISOString() };
  }
}

export async function getHistory(holding: Holding, days = 30): Promise<PricePoint[]> {
  if (holding.type === 'stock' || holding.type === 'etf') {
    const history = await alphaVantage.getStockHistory(holding.symbol);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter(p => p.timestamp >= cutoff);
  }
  if (holding.type === 'crypto') {
    return coinGecko.getCryptoHistory(holding.apiId || holding.symbol.toLowerCase(), days);
  }
  return [];
}

export function calculateHoldingMetrics(holding: Holding, currentPrice: number, portfolioTotal: number): HoldingWithMetrics {
  const currentValue = holding.quantity * currentPrice;
  const totalCost = holding.quantity * holding.purchasePrice;
  const gainLoss = currentValue - totalCost;
  const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
  const allocation = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;
  return { ...holding, currentPrice, currentValue, totalCost, gainLoss, gainLossPercent, allocation };
}

export function calculatePortfolioMetrics(holdings: HoldingWithMetrics[]) {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  return { totalValue, totalCost, totalGainLoss, totalGainLossPercent, dayChange: 0, dayChangePercent: 0 };
}

export async function getVolatility(holding: Holding): Promise<number> {
  const history = await getHistory(holding, 30);
  return holding.type === 'crypto' 
    ? coinGecko.calculateCryptoVolatility(history) 
    : alphaVantage.calculateVolatility(history, 30);
}

export default {
  searchAssets, searchStocks, searchCrypto, getCommodities,
  getPrice, getPrices, getExchangeRates, getHistory, getVolatility,
  calculateHoldingMetrics, calculatePortfolioMetrics,
};

export * from './config';
