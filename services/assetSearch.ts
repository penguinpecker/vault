// VAULT - Asset Search Service
// Search for stocks, crypto, and commodities using real APIs

import { API_CONFIG, COMMODITY_SYMBOLS, CRYPTO_IDS } from '../config/apiConfig';

export interface SearchResult {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf' | 'commodity';
  exchange?: string;
  price?: number;
  changePercent?: number;
}

// ============================================
// STOCK SEARCH (Finnhub)
// ============================================
async function searchStocks(query: string): Promise<SearchResult[]> {
  try {
    const url = `${API_CONFIG.finnhub.baseUrl}/search?q=${encodeURIComponent(query)}&token=${API_CONFIG.finnhub.key}`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.result || [])
      .filter((item: any) => item.type === 'Common Stock' || item.type === 'ETP' || item.type === 'ADR')
      .slice(0, 8)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type === 'ETP' ? 'etf' : 'stock',
        exchange: item.displaySymbol,
      }));
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}

// ============================================
// CRYPTO SEARCH (CoinGecko)
// ============================================
async function searchCrypto(query: string): Promise<SearchResult[]> {
  try {
    const url = `${API_CONFIG.coingecko.baseUrl}/search?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': API_CONFIG.coingecko.key,
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.coins || [])
      .slice(0, 8)
      .map((item: any) => ({
        symbol: item.symbol.toUpperCase(),
        name: item.name,
        type: 'crypto' as const,
        exchange: `Rank #${item.market_cap_rank || '—'}`,
      }));
  } catch (error) {
    console.error('Error searching crypto:', error);
    return [];
  }
}

// ============================================
// COMMODITY SEARCH (Local)
// ============================================
function searchCommodities(query: string): SearchResult[] {
  const commodities: SearchResult[] = [
    { symbol: 'XAU', name: 'Gold', type: 'commodity', exchange: 'Spot' },
    { symbol: 'XAG', name: 'Silver', type: 'commodity', exchange: 'Spot' },
    { symbol: 'XPT', name: 'Platinum', type: 'commodity', exchange: 'Spot' },
    { symbol: 'XPD', name: 'Palladium', type: 'commodity', exchange: 'Spot' },
  ];
  
  const lowerQuery = query.toLowerCase();
  
  return commodities.filter(c => 
    c.symbol.toLowerCase().includes(lowerQuery) ||
    c.name.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// COMBINED SEARCH
// ============================================
export async function searchAssets(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) {
    return [];
  }
  
  // Search all sources in parallel
  const [stocks, crypto] = await Promise.all([
    searchStocks(query),
    searchCrypto(query),
  ]);
  
  // Search commodities locally
  const commodities = searchCommodities(query);
  
  // Combine results: commodities first, then crypto, then stocks
  const combined = [
    ...commodities,
    ...crypto,
    ...stocks,
  ];
  
  // Remove duplicates by symbol
  const seen = new Set<string>();
  const unique = combined.filter(item => {
    const key = `${item.symbol}-${item.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return unique.slice(0, 15);
}

// ============================================
// GET ASSET PRICE
// ============================================
export async function getAssetPrice(symbol: string, type: 'stock' | 'crypto' | 'etf' | 'commodity'): Promise<{
  price: number;
  changePercent: number;
  name?: string;
} | null> {
  try {
    switch (type) {
      case 'crypto': {
        // Get CoinGecko ID
        const coinId = CRYPTO_IDS[symbol.toUpperCase()];
        
        if (!coinId) {
          // Search for the coin
          const searchUrl = `${API_CONFIG.coingecko.baseUrl}/search?query=${symbol}`;
          const searchResponse = await fetch(searchUrl, {
            headers: { 'x-cg-demo-api-key': API_CONFIG.coingecko.key },
          });
          
          if (!searchResponse.ok) return null;
          
          const searchData = await searchResponse.json();
          const coin = searchData.coins?.find(
            (c: any) => c.symbol.toUpperCase() === symbol.toUpperCase()
          );
          
          if (!coin) return null;
          
          // Get price for found coin
          const priceUrl = `${API_CONFIG.coingecko.baseUrl}/simple/price?ids=${coin.id}&vs_currencies=usd&include_24hr_change=true`;
          const priceResponse = await fetch(priceUrl, {
            headers: { 'x-cg-demo-api-key': API_CONFIG.coingecko.key },
          });
          
          if (!priceResponse.ok) return null;
          
          const priceData = await priceResponse.json();
          const coinPrice = priceData[coin.id];
          
          return coinPrice ? {
            price: coinPrice.usd,
            changePercent: coinPrice.usd_24h_change || 0,
            name: coin.name,
          } : null;
        }
        
        // Known coin - get price directly
        const url = `${API_CONFIG.coingecko.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
        const response = await fetch(url, {
          headers: { 'x-cg-demo-api-key': API_CONFIG.coingecko.key },
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const coinData = data[coinId];
        
        return coinData ? {
          price: coinData.usd,
          changePercent: coinData.usd_24h_change || 0,
        } : null;
      }
      
      case 'commodity': {
        const url = `${API_CONFIG.metals.baseUrl}/latest?api_key=${API_CONFIG.metals.key}&currency=USD&unit=oz`;
        const response = await fetch(url);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        const metalMap: Record<string, string> = {
          'XAU': 'gold',
          'GOLD': 'gold',
          'XAG': 'silver',
          'SILVER': 'silver',
          'XPT': 'platinum',
          'PLATINUM': 'platinum',
          'XPD': 'palladium',
          'PALLADIUM': 'palladium',
        };
        
        const metalName = metalMap[symbol.toUpperCase()];
        const price = data.metals?.[metalName];
        
        return price ? {
          price,
          changePercent: 0, // Metals.dev free tier doesn't include change
        } : null;
      }
      
      case 'stock':
      case 'etf':
      default: {
        const url = `${API_CONFIG.finnhub.baseUrl}/quote?symbol=${symbol}&token=${API_CONFIG.finnhub.key}`;
        const response = await fetch(url);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (!data || data.c === 0 || data.c === undefined) return null;
        
        return {
          price: data.c,
          changePercent: data.dp || 0,
        };
      }
    }
  } catch (error) {
    console.error('Error getting asset price:', error);
    return null;
  }
}

// ============================================
// POPULAR ASSETS (for empty search state)
// ============================================
export function getPopularAssets(): SearchResult[] {
  return [
    // Popular Stocks
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', exchange: 'NASDAQ' },
    
    // UK Stocks
    { symbol: 'BARC.L', name: 'Barclays PLC', type: 'stock', exchange: 'LSE' },
    { symbol: 'HSBA.L', name: 'HSBC Holdings', type: 'stock', exchange: 'LSE' },
    { symbol: 'VOD.L', name: 'Vodafone Group', type: 'stock', exchange: 'LSE' },
    
    // Popular ETFs
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', exchange: 'NYSE' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', exchange: 'NASDAQ' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market', type: 'etf', exchange: 'NYSE' },
    
    // Popular Crypto
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', exchange: 'Rank #1' },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto', exchange: 'Rank #2' },
    { symbol: 'SOL', name: 'Solana', type: 'crypto', exchange: 'Rank #5' },
    { symbol: 'XRP', name: 'XRP', type: 'crypto', exchange: 'Rank #4' },
    
    // Commodities
    { symbol: 'XAU', name: 'Gold', type: 'commodity', exchange: 'Spot' },
    { symbol: 'XAG', name: 'Silver', type: 'commodity', exchange: 'Spot' },
  ];
}
