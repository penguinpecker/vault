// VAULT - usePrices Hook
// Real-time price updates for holdings

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchPrice, 
  fetchMultiplePrices, 
  PriceData, 
  PriceError,
  detectAssetType 
} from '../services/priceService';
import { Holding } from '../context/HoldingsContext';

interface UsePricesOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

interface UsePricesResult {
  prices: Map<string, PriceData>;
  errors: Map<string, string>;
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function usePrices(
  holdings: Holding[],
  options: UsePricesOptions = {}
): UsePricesResult {
  const { 
    refreshInterval = 60000, // Default: 1 minute
    autoRefresh = true 
  } = options;

  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) {
      setPrices(new Map());
      setErrors(new Map());
      return;
    }

    setLoading(true);

    try {
      const holdingsData = holdings.map(h => ({
        symbol: h.symbol,
        type: h.type,
      }));

      const results = await fetchMultiplePrices(holdingsData);

      const newPrices = new Map<string, PriceData>();
      const newErrors = new Map<string, string>();

      results.forEach((value, key) => {
        if ('error' in value) {
          newErrors.set(key, value.error);
        } else {
          newPrices.set(key, value);
        }
      });

      setPrices(newPrices);
      setErrors(newErrors);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  // Initial fetch
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && holdings.length > 0) {
      intervalRef.current = setInterval(fetchPrices, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchPrices, holdings.length]);

  return {
    prices,
    errors,
    loading,
    lastUpdated,
    refresh: fetchPrices,
  };
}

// Hook for single price
export function usePrice(symbol: string, type?: string) {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const assetType = type || detectAssetType(symbol);
      const data = await fetchPrice(symbol, assetType as any);
      setPrice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  }, [symbol, type]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { price, loading, error, refresh: fetch };
}
