// VAULT - Unified Price Service
// Fetches real-time prices from Finnhub, CoinGecko, and Metals.dev

import { API_CONFIG, COMMODITY_SYMBOLS, CRYPTO_IDS, ASSET_TYPES } from '../config/apiConfig';

export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: string;
  source: 'finnhub' | 'coingecko' | 'metals';
}

export interface PriceError {
  symbol: string;
  error: string;
}

type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];

// Detect asset type from symbol
export function detectAssetType(symbol: string): AssetType {
  const upperSymbol = symbol.toUpperCase();
  
  // Check if it's a commodity
  if (COMMODITY_SYMBOLS[upperSymbol]) {
    return ASSET_TYPES.COMMODITY;
  }
  
  // Check if it's a known crypto
  if (CRYPTO_IDS[upperSymbol]) {
    return ASSET_TYPES.CRYPTO;
  }
  
  // Check for ETF patterns (common ETF suffixes)
  const etfPatterns = ['SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'AGG', 'GLD', 'SLV', 'USO'];
  if (etfPatterns.includes(upperSymbol) || upperSymbol.endsWith('.L') && upperSymbol.includes('ETF')) {
    return ASSET_TYPES.ETF;
  }
  
  // Default to stock
  return ASSET_TYPES.STOCK;
}

// Format symbol for UK stocks (add .L suffix for Finnhub)
function formatStockSymbol(symbol: string, market: 'US' | 'UK' = 'US'): string {
  const upperSymbol = symbol.toUpperCase();
  
  // Already has .L suffix
  if (upperSymbol.endsWith('.L')) {
    return upperSymbol;
  }
  
  // UK market
  if (market === 'UK') {
    return `${upperSymbol}.L`;
  }
  
  return upperSymbol;
}

// ============================================
// FINNHUB - Stocks & ETFs
// ============================================
async function fetchStockPrice(symbol: string): Promise<PriceData> {
  const formattedSymbol = formatStockSymbol(symbol);
  
  const url = `${API_CONFIG.finnhub.baseUrl}/quote?symbol=${formattedSymbol}&token=${API_CONFIG.finnhub.key}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Finnhub returns { c: current, d: change, dp: change%, h: high, l: low, o: open, pc: prevClose, t: timestamp }
  if (!data || data.c === 0 || data.c === undefined) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }
  
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(), // Finnhub quote doesn't return name
    price: data.c,
    change: data.d || 0,
    changePercent: data.dp || 0,
    high24h: data.h,
    low24h: data.l,
    lastUpdated: new Date().toISOString(),
    source: 'finnhub',
  };
}

// Get company profile for name
async function fetchCompanyProfile(symbol: string): Promise<{ name: string } | null> {
  try {
    const formattedSymbol = formatStockSymbol(symbol);
    const url = `${API_CONFIG.finnhub.baseUrl}/stock/profile2?symbol=${formattedSymbol}&token=${API_CONFIG.finnhub.key}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.name ? { name: data.name } : null;
  } catch {
    return null;
  }
}

// ============================================
// COINGECKO - Cryptocurrency
// ============================================
async function fetchCryptoPrice(symbol: string): Promise<PriceData> {
  const upperSymbol = symbol.toUpperCase();
  const coinId = CRYPTO_IDS[upperSymbol];
  
  if (!coinId) {
    // Try to search for the coin
    const searchResult = await searchCryptoBySymbol(upperSymbol);
    if (!searchResult) {
      throw new Error(`Unknown cryptocurrency: ${symbol}`);
    }
    return fetchCryptoPriceById(searchResult.id, upperSymbol);
  }
  
  return fetchCryptoPriceById(coinId, upperSymbol);
}

async function fetchCryptoPriceById(coinId: string, symbol: string): Promise<PriceData> {
  const url = `${API_CONFIG.coingecko.baseUrl}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`;
  
  const response = await fetch(url, {
    headers: {
      'x-cg-demo-api-key': API_CONFIG.coingecko.key,
    },
  });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    symbol: symbol.toUpperCase(),
    name: data.name,
    price: data.market_data.current_price.usd,
    change: data.market_data.price_change_24h || 0,
    changePercent: data.market_data.price_change_percentage_24h || 0,
    high24h: data.market_data.high_24h?.usd,
    low24h: data.market_data.low_24h?.usd,
    volume: data.market_data.total_volume?.usd,
    marketCap: data.market_data.market_cap?.usd,
    lastUpdated: data.market_data.last_updated || new Date().toISOString(),
    source: 'coingecko',
  };
}

async function searchCryptoBySymbol(symbol: string): Promise<{ id: string; name: string } | null> {
  try {
    const url = `${API_CONFIG.coingecko.baseUrl}/search?query=${symbol}`;
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': API_CONFIG.coingecko.key,
      },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Find exact symbol match
    const coin = data.coins?.find(
      (c: any) => c.symbol.toUpperCase() === symbol.toUpperCase()
    );
    
    return coin ? { id: coin.id, name: coin.name } : null;
  } catch {
    return null;
  }
}

// Batch fetch multiple crypto prices (more efficient)
export async function fetchMultipleCryptoPrices(symbols: string[]): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();
  
  // Convert symbols to CoinGecko IDs
  const coinIds = symbols
    .map(s => CRYPTO_IDS[s.toUpperCase()])
    .filter(Boolean);
  
  if (coinIds.length === 0) return results;
  
  const url = `${API_CONFIG.coingecko.baseUrl}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': API_CONFIG.coingecko.key,
      },
    });
    
    if (!response.ok) return results;
    
    const data = await response.json();
    
    for (const coin of data) {
      const symbol = coin.symbol.toUpperCase();
      results.set(symbol, {
        symbol,
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_24h || 0,
        changePercent: coin.price_change_percentage_24h || 0,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        volume: coin.total_volume,
        marketCap: coin.market_cap,
        lastUpdated: coin.last_updated || new Date().toISOString(),
        source: 'coingecko',
      });
    }
  } catch (error) {
    console.error('Error fetching multiple crypto prices:', error);
  }
  
  return results;
}

// ============================================
// METALS.DEV - Commodities
// ============================================
async function fetchCommodityPrice(symbol: string): Promise<PriceData> {
  const upperSymbol = symbol.toUpperCase();
  const metalName = COMMODITY_SYMBOLS[upperSymbol];
  
  if (!metalName) {
    throw new Error(`Unknown commodity: ${symbol}`);
  }
  
  const url = `${API_CONFIG.metals.baseUrl}/latest?api_key=${API_CONFIG.metals.key}&currency=USD&unit=oz`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Metals.dev API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Metals.dev returns { metals: { gold: price, silver: price, ... } }
  const price = data.metals?.[metalName];
  
  if (!price) {
    throw new Error(`No price data for: ${metalName}`);
  }
  
  // Get display name
  const displayNames: Record<string, string> = {
    gold: 'Gold',
    silver: 'Silver',
    platinum: 'Platinum',
    palladium: 'Palladium',
  };
  
  return {
    symbol: upperSymbol,
    name: displayNames[metalName] || metalName,
    price: price,
    change: 0, // Metals.dev doesn't provide change data in free tier
    changePercent: 0,
    lastUpdated: data.timestamp || new Date().toISOString(),
    source: 'metals',
  };
}

// Fetch all commodity prices at once (saves API calls)
export async function fetchAllCommodityPrices(): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();
  
  try {
    const url = `${API_CONFIG.metals.baseUrl}/latest?api_key=${API_CONFIG.metals.key}&currency=USD&unit=oz`;
    
    const response = await fetch(url);
    
    if (!response.ok) return results;
    
    const data = await response.json();
    
    const metals = data.metals || {};
    const timestamp = data.timestamp || new Date().toISOString();
    
    const symbolMap: Record<string, string> = {
      gold: 'XAU',
      silver: 'XAG',
      platinum: 'XPT',
      palladium: 'XPD',
    };
    
    const displayNames: Record<string, string> = {
      gold: 'Gold',
      silver: 'Silver',
      platinum: 'Platinum',
      palladium: 'Palladium',
    };
    
    for (const [metal, price] of Object.entries(metals)) {
      const symbol = symbolMap[metal];
      if (symbol && typeof price === 'number') {
        results.set(symbol, {
          symbol,
          name: displayNames[metal] || metal,
          price,
          change: 0,
          changePercent: 0,
          lastUpdated: timestamp,
          source: 'metals',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching commodity prices:', error);
  }
  
  return results;
}

// ============================================
// UNIFIED PRICE FETCHER
// ============================================
export async function fetchPrice(symbol: string, assetType?: AssetType): Promise<PriceData> {
  const type = assetType || detectAssetType(symbol);
  
  switch (type) {
    case ASSET_TYPES.CRYPTO:
      return fetchCryptoPrice(symbol);
    
    case ASSET_TYPES.COMMODITY:
      return fetchCommodityPrice(symbol);
    
    case ASSET_TYPES.STOCK:
    case ASSET_TYPES.ETF:
    default:
      return fetchStockPrice(symbol);
  }
}

// Fetch multiple prices efficiently
export async function fetchMultiplePrices(
  holdings: Array<{ symbol: string; type: AssetType }>
): Promise<Map<string, PriceData | PriceError>> {
  const results = new Map<string, PriceData | PriceError>();
  
  // Group by asset type
  const cryptoSymbols = holdings.filter(h => h.type === 'crypto').map(h => h.symbol);
  const stockSymbols = holdings.filter(h => h.type === 'stock' || h.type === 'etf').map(h => h.symbol);
  const commoditySymbols = holdings.filter(h => h.type === 'commodity').map(h => h.symbol);
  
  // Fetch crypto prices in batch
  if (cryptoSymbols.length > 0) {
    const cryptoPrices = await fetchMultipleCryptoPrices(cryptoSymbols);
    cryptoPrices.forEach((value, key) => results.set(key, value));
  }
  
  // Fetch commodity prices in batch
  if (commoditySymbols.length > 0) {
    const commodityPrices = await fetchAllCommodityPrices();
    commoditySymbols.forEach(symbol => {
      const price = commodityPrices.get(symbol.toUpperCase());
      if (price) {
        results.set(symbol.toUpperCase(), price);
      }
    });
  }
  
  // Fetch stock prices individually (Finnhub doesn't have batch endpoint in free tier)
  for (const symbol of stockSymbols) {
    try {
      const price = await fetchStockPrice(symbol);
      
      // Try to get company name
      const profile = await fetchCompanyProfile(symbol);
      if (profile?.name) {
        price.name = profile.name;
      }
      
      results.set(symbol.toUpperCase(), price);
    } catch (error) {
      results.set(symbol.toUpperCase(), {
        symbol: symbol.toUpperCase(),
        error: error instanceof Error ? error.message : 'Failed to fetch price',
      });
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// ============================================
// SEARCH FUNCTIONS
// ============================================
export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
}

// Search for stocks
export async function searchStocks(query: string): Promise<SearchResult[]> {
  try {
    const url = `${API_CONFIG.finnhub.baseUrl}/search?q=${encodeURIComponent(query)}&token=${API_CONFIG.finnhub.key}`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.result || []).slice(0, 10).map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
      type: item.type === 'ETP' ? ASSET_TYPES.ETF : ASSET_TYPES.STOCK,
      exchange: item.displaySymbol,
    }));
  } catch {
    return [];
  }
}

// Search for crypto
export async function searchCrypto(query: string): Promise<SearchResult[]> {
  try {
    const url = `${API_CONFIG.coingecko.baseUrl}/search?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': API_CONFIG.coingecko.key,
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.coins || []).slice(0, 10).map((item: any) => ({
      symbol: item.symbol.toUpperCase(),
      name: item.name,
      type: ASSET_TYPES.CRYPTO,
      exchange: 'Crypto',
    }));
  } catch {
    return [];
  }
}

// Combined search
export async function searchAssets(query: string): Promise<SearchResult[]> {
  const [stocks, crypto] = await Promise.all([
    searchStocks(query),
    searchCrypto(query),
  ]);
  
  // Add commodities if query matches
  const commodities: SearchResult[] = [];
  const upperQuery = query.toUpperCase();
  
  if ('GOLD'.includes(upperQuery) || 'XAU'.includes(upperQuery)) {
    commodities.push({ symbol: 'XAU', name: 'Gold', type: ASSET_TYPES.COMMODITY });
  }
  if ('SILVER'.includes(upperQuery) || 'XAG'.includes(upperQuery)) {
    commodities.push({ symbol: 'XAG', name: 'Silver', type: ASSET_TYPES.COMMODITY });
  }
  if ('PLATINUM'.includes(upperQuery) || 'XPT'.includes(upperQuery)) {
    commodities.push({ symbol: 'XPT', name: 'Platinum', type: ASSET_TYPES.COMMODITY });
  }
  if ('PALLADIUM'.includes(upperQuery) || 'XPD'.includes(upperQuery)) {
    commodities.push({ symbol: 'XPD', name: 'Palladium', type: ASSET_TYPES.COMMODITY });
  }
  
  // Combine and return
  return [...commodities, ...crypto.slice(0, 5), ...stocks.slice(0, 5)];
}
