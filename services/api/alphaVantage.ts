// VAULT - Alpha Vantage API Service
import { API_CONFIG, SearchResult, PriceData, PricePoint } from './config';

const { BASE_URL, API_KEY } = API_CONFIG.ALPHA_VANTAGE;

export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  
  try {
    const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Note || data['Error Message']) {
      console.warn('Alpha Vantage API limit:', data.Note || data['Error Message']);
      return [];
    }
    
    const matches = data.bestMatches || [];
    
    return matches.map((match: any) => ({
      id: match['1. symbol'],
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type']?.toLowerCase().includes('etf') ? 'etf' : 'stock',
      region: match['4. region'],
      currency: match['8. currency'] || 'USD',
    }));
  } catch (error) {
    console.error('Alpha Vantage search error:', error);
    return [];
  }
}

export async function getStockQuote(symbol: string): Promise<PriceData | null> {
  try {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Note || data['Error Message']) {
      console.warn('Alpha Vantage API limit:', data.Note || data['Error Message']);
      return null;
    }
    
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) return null;
    
    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change'] || '0'),
      changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
      high: parseFloat(quote['03. high'] || '0'),
      low: parseFloat(quote['04. low'] || '0'),
      volume: parseInt(quote['06. volume'] || '0'),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Alpha Vantage quote error:', error);
    return null;
  }
}

export async function getStockHistory(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<PricePoint[]> {
  try {
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=${outputSize}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Note || data['Error Message']) return [];
    
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return [];
    
    return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      timestamp: new Date(date).getTime(),
      price: parseFloat(values['4. close']),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    })).sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Alpha Vantage history error:', error);
    return [];
  }
}

export function calculateVolatility(priceHistory: PricePoint[], days: number = 30): number {
  if (priceHistory.length < 2) return 0;
  
  const recentPrices = priceHistory.slice(-days);
  if (recentPrices.length < 2) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < recentPrices.length; i++) {
    const prevPrice = recentPrices[i - 1].price;
    const currPrice = recentPrices[i].price;
    if (prevPrice > 0) returns.push((currPrice - prevPrice) / prevPrice);
  }
  
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export default { searchStocks, getStockQuote, getStockHistory, calculateVolatility };
