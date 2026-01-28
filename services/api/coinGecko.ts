// VAULT - CoinGecko API Service
import { API_CONFIG, SearchResult, PriceData, PricePoint, Currency } from './config';

const { BASE_URL } = API_CONFIG.COINGECKO;

export async function searchCrypto(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  
  try {
    const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return (data.coins || []).slice(0, 20).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      type: 'crypto' as const,
      image: coin.thumb,
      currency: 'USD',
    }));
  } catch (error) {
    console.error('CoinGecko search error:', error);
    return [];
  }
}

export async function getCryptoPrices(coinIds: string[], currency: Currency = 'USD'): Promise<Record<string, PriceData>> {
  if (coinIds.length === 0) return {};
  
  try {
    const ids = coinIds.join(',');
    const curr = currency.toLowerCase();
    const url = `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=${curr}&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const results: Record<string, PriceData> = {};
    
    for (const [id, values] of Object.entries(data) as [string, any][]) {
      const price = values[curr];
      const change24h = values[`${curr}_24h_change`] || 0;
      
      results[id] = {
        price,
        change: (price * change24h) / 100,
        changePercent: change24h,
        volume: values[`${curr}_24h_vol`] || 0,
        lastUpdated: values.last_updated_at 
          ? new Date(values.last_updated_at * 1000).toISOString()
          : new Date().toISOString(),
      };
    }
    
    return results;
  } catch (error) {
    console.error('CoinGecko prices error:', error);
    return {};
  }
}

export async function getCryptoHistory(coinId: string, days: number = 30, currency: Currency = 'USD'): Promise<PricePoint[]> {
  try {
    const curr = currency.toLowerCase();
    const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${curr}&days=${days}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return (data.prices || []).map(([timestamp, price]: [number, number]) => ({ timestamp, price }));
  } catch (error) {
    console.error('CoinGecko history error:', error);
    return [];
  }
}

export function calculateCryptoVolatility(priceHistory: PricePoint[]): number {
  if (priceHistory.length < 2) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < priceHistory.length; i++) {
    const prevPrice = priceHistory[i - 1].price;
    const currPrice = priceHistory[i].price;
    if (prevPrice > 0) returns.push((currPrice - prevPrice) / prevPrice);
  }
  
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
}

export default { searchCrypto, getCryptoPrices, getCryptoHistory, calculateCryptoVolatility };
