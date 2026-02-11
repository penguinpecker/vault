// VAULT - Holdings Context with Background Sync & Auto Transaction Recording
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { fetchMultiplePrices, PriceData } from '../services/priceService';

// Types
export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf' | 'commodity';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  dayChangePercent: number;
  currentValue: number;
  totalCost: number;
  gain: number;
  gainPercent: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface Allocation {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface HoldingsContextType {
  holdings: Holding[];
  metrics: PortfolioMetrics;
  allocations: Allocation[];
  loading: boolean;
  pricesLoading: boolean;
  error: string | null;
  lastPriceUpdate: Date | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  addHolding: (holding: Omit<Holding, 'id' | 'currentValue' | 'totalCost' | 'gain' | 'gainPercent'>) => Promise<void>;
  removeHolding: (id: string) => Promise<void>;
  updateHolding: (id: string, updates: Partial<Holding>) => Promise<void>;
  refreshHoldings: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  getCurrentPriceMap: () => Map<string, number>;
}

const HoldingsContext = createContext<HoldingsContextType | undefined>(undefined);

const TYPE_COLORS: Record<string, string> = {
  stock: '#D4AF37',
  crypto: '#C0C0C0',
  etf: '#B87333',
  commodity: '#C9AE5D',
};

const TYPE_NAMES: Record<string, string> = {
  stock: 'Stocks',
  crypto: 'Crypto',
  etf: 'ETFs',
  commodity: 'Commodities',
};

const PRICE_UPDATE_INTERVAL = 60000; // 60s
const BACKGROUND_STALE_MS = 5 * 60 * 1000; // 5 min

export function HoldingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const priceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimestampRef = useRef<number>(0);
  const holdingsRef = useRef<Holding[]>([]);

  useEffect(() => { holdingsRef.current = holdings; }, [holdings]);

  // ============================================
  // BACKGROUND SYNC via AppState
  // ============================================
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextState === 'active') {
        const elapsed = Date.now() - backgroundTimestampRef.current;
        if (backgroundTimestampRef.current > 0 && elapsed > BACKGROUND_STALE_MS) {
          if (holdingsRef.current.length > 0) {
            updatePrices(holdingsRef.current);
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub?.remove();
  }, []);

  // ============================================
  // FETCH HOLDINGS
  // ============================================
  const fetchHoldings = useCallback(async () => {
    if (!user) { setHoldings([]); setLoading(false); return; }

    try {
      setLoading(true);
      setError(null);
      setSyncStatus('syncing');

      const { data, error: fetchError } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: Holding[] = (data || []).map(item => {
        const currentValue = item.quantity * item.current_price;
        const totalCost = item.quantity * item.purchase_price;
        const gain = currentValue - totalCost;
        const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

        return {
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          type: item.type,
          quantity: parseFloat(item.quantity),
          purchasePrice: parseFloat(item.purchase_price),
          currentPrice: parseFloat(item.current_price),
          dayChangePercent: parseFloat(item.day_change_percent || 0),
          currentValue, totalCost, gain, gainPercent,
        };
      });

      setHoldings(mapped);
      setSyncStatus('synced');

      if (mapped.length > 0) await updatePrices(mapped);
    } catch (err) {
      console.error('Error fetching holdings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ============================================
  // UPDATE PRICES
  // ============================================
  const updatePrices = useCallback(async (currentHoldings: Holding[]) => {
    if (currentHoldings.length === 0) return;

    setPricesLoading(true);
    setSyncStatus('syncing');

    try {
      const holdingsData = currentHoldings.map(h => ({ symbol: h.symbol, type: h.type }));
      const priceResults = await fetchMultiplePrices(holdingsData);

      const updated = currentHoldings.map(holding => {
        const priceData = priceResults.get(holding.symbol.toUpperCase());
        if (priceData && !('error' in priceData)) {
          const currentPrice = priceData.price;
          const dayChangePercent = priceData.changePercent;
          const currentValue = holding.quantity * currentPrice;
          const totalCost = holding.quantity * holding.purchasePrice;
          const gain = currentValue - totalCost;
          const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;
          return { ...holding, name: priceData.name || holding.name, currentPrice, dayChangePercent, currentValue, gain, gainPercent };
        }
        return holding;
      });

      setHoldings(updated);
      setLastPriceUpdate(new Date());
      setSyncStatus('synced');

      // Background DB sync
      if (user) {
        for (const h of updated) {
          supabase.from('holdings').update({
            current_price: h.currentPrice,
            day_change_percent: h.dayChangePercent,
            name: h.name,
            updated_at: new Date().toISOString(),
          }).eq('id', h.id).eq('user_id', user.id).then(() => {});
        }
      }
    } catch (err) {
      console.error('Error updating prices:', err);
      setSyncStatus('error');
    } finally {
      setPricesLoading(false);
    }
  }, [user]);

  // ============================================
  // PRICE MAP for alert checking
  // ============================================
  const getCurrentPriceMap = useCallback((): Map<string, number> => {
    const map = new Map<string, number>();
    holdingsRef.current.forEach(h => map.set(h.symbol.toUpperCase(), h.currentPrice));
    return map;
  }, []);

  const refreshPrices = useCallback(async () => {
    await updatePrices(holdingsRef.current);
  }, [updatePrices]);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  // Auto-refresh interval
  useEffect(() => {
    if (holdings.length > 0) {
      priceIntervalRef.current = setInterval(() => updatePrices(holdingsRef.current), PRICE_UPDATE_INTERVAL);
    }
    return () => { if (priceIntervalRef.current) clearInterval(priceIntervalRef.current); };
  }, [holdings.length, updatePrices]);

  // ============================================
  // ADD HOLDING + auto BUY transaction
  // ============================================
  const addHolding = useCallback(async (
    holding: Omit<Holding, 'id' | 'currentValue' | 'totalCost' | 'gain' | 'gainPercent'>
  ) => {
    if (!user) return;

    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('holdings')
        .insert({
          user_id: user.id,
          symbol: holding.symbol.toUpperCase(),
          name: holding.name,
          type: holding.type,
          quantity: holding.quantity,
          purchase_price: holding.purchasePrice,
          current_price: holding.currentPrice,
          day_change_percent: holding.dayChangePercent,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const currentValue = data.quantity * data.current_price;
      const totalCost = data.quantity * data.purchase_price;
      const gain = currentValue - totalCost;
      const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

      const newHolding: Holding = {
        id: data.id, symbol: data.symbol, name: data.name, type: data.type,
        quantity: parseFloat(data.quantity), purchasePrice: parseFloat(data.purchase_price),
        currentPrice: parseFloat(data.current_price), dayChangePercent: parseFloat(data.day_change_percent || 0),
        currentValue, totalCost, gain, gainPercent,
      };

      setHoldings(prev => [newHolding, ...prev]);

      // Auto-record BUY transaction (non-blocking, won't fail if table missing)
      supabase.from('transactions').insert({
        user_id: user.id, holding_id: data.id, symbol: data.symbol, name: data.name,
        type: 'buy', quantity: holding.quantity, price: holding.purchasePrice,
        total: holding.quantity * holding.purchasePrice,
      }).then(() => {});
    } catch (err) {
      console.error('Error adding holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to add holding');
      throw err;
    }
  }, [user]);

  // ============================================
  // REMOVE HOLDING + auto SELL transaction
  // ============================================
  const removeHolding = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);
      const holdingToRemove = holdingsRef.current.find(h => h.id === id);

      const { error: deleteError } = await supabase
        .from('holdings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      setHoldings(prev => prev.filter(h => h.id !== id));

      // Auto-record SELL transaction
      if (holdingToRemove) {
        supabase.from('transactions').insert({
          user_id: user.id, holding_id: id, symbol: holdingToRemove.symbol, name: holdingToRemove.name,
          type: 'sell', quantity: holdingToRemove.quantity, price: holdingToRemove.currentPrice,
          total: holdingToRemove.quantity * holdingToRemove.currentPrice,
        }).then(() => {});
      }
    } catch (err) {
      console.error('Error removing holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove holding');
      throw err;
    }
  }, [user]);

  // ============================================
  // UPDATE HOLDING
  // ============================================
  const updateHolding = useCallback(async (id: string, updates: Partial<Holding>) => {
    if (!user) return;

    try {
      setError(null);
      const dbUpdates: Record<string, any> = {};
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
      if (updates.currentPrice !== undefined) dbUpdates.current_price = updates.currentPrice;
      if (updates.dayChangePercent !== undefined) dbUpdates.day_change_percent = updates.dayChangePercent;
      dbUpdates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase.from('holdings').update(dbUpdates).eq('id', id).eq('user_id', user.id);
      if (updateError) throw updateError;

      setHoldings(prev => prev.map(h => {
        if (h.id !== id) return h;
        const u = { ...h, ...updates };
        u.currentValue = u.quantity * u.currentPrice;
        u.totalCost = u.quantity * u.purchasePrice;
        u.gain = u.currentValue - u.totalCost;
        u.gainPercent = u.totalCost > 0 ? (u.gain / u.totalCost) * 100 : 0;
        return u;
      }));
    } catch (err) {
      console.error('Error updating holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to update holding');
      throw err;
    }
  }, [user]);

  const refreshHoldings = useCallback(async () => { await fetchHoldings(); }, [fetchHoldings]);

  // ============================================
  // COMPUTED METRICS
  // ============================================
  const metrics = useMemo<PortfolioMetrics>(() => {
    if (holdings.length === 0) return { totalValue: 0, totalCost: 0, totalGain: 0, totalGainPercent: 0, dayChange: 0, dayChangePercent: 0 };

    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const dayChange = holdings.reduce((sum, h) => {
      const prev = h.currentValue / (1 + h.dayChangePercent / 100);
      return sum + (h.currentValue - prev);
    }, 0);
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    return { totalValue, totalCost, totalGain, totalGainPercent, dayChange, dayChangePercent };
  }, [holdings]);

  const allocations = useMemo<Allocation[]>(() => {
    return ['stock', 'crypto', 'etf', 'commodity'].map(type => {
      const value = holdings.filter(h => h.type === type).reduce((sum, h) => sum + h.currentValue, 0);
      return {
        name: TYPE_NAMES[type],
        value,
        percent: metrics.totalValue > 0 ? Math.round((value / metrics.totalValue) * 100) : 0,
        color: TYPE_COLORS[type],
      };
    });
  }, [holdings, metrics.totalValue]);

  return (
    <HoldingsContext.Provider value={{
      holdings, metrics, allocations, loading, pricesLoading, error,
      lastPriceUpdate, syncStatus,
      addHolding, removeHolding, updateHolding, refreshHoldings, refreshPrices, getCurrentPriceMap,
    }}>
      {children}
    </HoldingsContext.Provider>
  );
}

export function useHoldings() {
  const context = useContext(HoldingsContext);
  if (context === undefined) throw new Error('useHoldings must be used within a HoldingsProvider');
  return context;
}
