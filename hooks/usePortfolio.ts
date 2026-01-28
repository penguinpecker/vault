// VAULT - React Hooks for Portfolio Management
import { useState, useEffect, useCallback } from 'react';
import API, { Holding, HoldingWithMetrics, PriceData, SearchResult, AssetType, Currency } from '../services/api';
import Storage from '../services/api/storage';

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingsWithMetrics, setHoldingsWithMetrics] = useState<HoldingWithMetrics[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHoldings = useCallback(async () => {
    const stored = await Storage.getHoldings();
    setHoldings(stored);
    return stored;
  }, []);

  const fetchPrices = useCallback(async (holdingsList: Holding[]) => {
    if (holdingsList.length === 0) return {};
    try {
      const priceData = await API.getPrices(holdingsList);
      setPrices(priceData);
      setLastUpdated(new Date());
      return priceData;
    } catch (err) {
      setError('Failed to fetch prices');
      return {};
    }
  }, []);

  const calculateMetrics = useCallback((holdingsList: Holding[], priceData: Record<string, PriceData>) => {
    let totalValue = 0;
    for (const h of holdingsList) {
      const price = priceData[h.id]?.price || h.currentPrice || h.purchasePrice;
      totalValue += h.quantity * price;
    }
    
    const withMetrics = holdingsList.map(h => {
      const price = priceData[h.id]?.price || h.currentPrice || h.purchasePrice;
      return API.calculateHoldingMetrics(h, price, totalValue);
    }).sort((a, b) => b.allocation - a.allocation);
    
    setHoldingsWithMetrics(withMetrics);
    return withMetrics;
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const stored = await loadHoldings();
      if (stored.length > 0) {
        const priceData = await fetchPrices(stored);
        calculateMetrics(stored, priceData);
      }
      setIsLoading(false);
    })();
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    const priceData = await fetchPrices(holdings);
    calculateMetrics(holdings, priceData);
    setIsRefreshing(false);
  }, [holdings, fetchPrices, calculateMetrics]);

  const addHolding = useCallback(async (holding: Omit<Holding, 'id'>) => {
    const newHolding: Holding = { ...holding, id: Storage.generateId() };
    const updated = await Storage.addHolding(newHolding);
    setHoldings(updated);
    
    const price = await API.getPrice(newHolding);
    const newPrices = { ...prices };
    newPrices[newHolding.id] = price || { price: newHolding.purchasePrice, change: 0, changePercent: 0, lastUpdated: new Date().toISOString() };
    setPrices(newPrices);
    calculateMetrics(updated, newPrices);
    
    return newHolding;
  }, [prices, calculateMetrics]);

  const updateHolding = useCallback(async (holdingId: string, updates: Partial<Holding>) => {
    const updated = await Storage.updateHolding(holdingId, updates);
    setHoldings(updated);
    calculateMetrics(updated, prices);
  }, [prices, calculateMetrics]);

  const deleteHolding = useCallback(async (holdingId: string) => {
    const updated = await Storage.deleteHolding(holdingId);
    setHoldings(updated);
    const newPrices = { ...prices };
    delete newPrices[holdingId];
    setPrices(newPrices);
    calculateMetrics(updated, newPrices);
  }, [prices, calculateMetrics]);

  const portfolioMetrics = API.calculatePortfolioMetrics(holdingsWithMetrics);

  return {
    holdings, holdingsWithMetrics, prices, portfolioMetrics,
    isLoading, isRefreshing, lastUpdated, error,
    refresh, addHolding, updateHolding, deleteHolding,
  };
}

export function useAssetSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<AssetType | 'all'>('all');

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const type = activeTab === 'all' ? undefined : activeTab;
      const searchResults = await API.searchAssets(query, type);
      setResults(searchResults);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  return { query, setQuery, results, isSearching, activeTab, setActiveTab, commodities: API.getCommodities() };
}

export function useSettings() {
  const [settings, setSettings] = useState<Storage.AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Storage.getSettings().then(s => { setSettings(s); setIsLoading(false); });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Storage.AppSettings>) => {
    const updated = await Storage.saveSettings(updates);
    setSettings(updated);
    return updated;
  }, []);

  return { settings, isLoading, updateSettings };
}

export function useExchangeRate(from: Currency = 'USD', to: Currency = 'GBP') {
  const [rate, setRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    API.getExchangeRates(from).then(rates => {
      setRate(rates.rates[to] || 1);
      setIsLoading(false);
    });
  }, [from, to]);

  return { rate, isLoading, convert: (amount: number) => amount * rate };
}

export default { usePortfolio, useAssetSearch, useSettings, useExchangeRate };
