// VAULT - Holdings Context with Real-Time Prices
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  addHolding: (holding: Omit<Holding, 'id' | 'currentValue' | 'totalCost' | 'gain' | 'gainPercent'>) => Promise<void>;
  removeHolding: (id: string) => Promise<void>;
  updateHolding: (id: string, updates: Partial<Holding>) => Promise<void>;
  refreshHoldings: () => Promise<void>;
  refreshPrices: () => Promise<void>;
}

const HoldingsContext = createContext<HoldingsContextType | undefined>(undefined);

// Allocation colors
const TYPE_COLORS: Record<string, string> = {
  stock: '#D4AF37',    // Gold
  crypto: '#C0C0C0',   // Silver
  etf: '#B87333',      // Copper
  commodity: '#C9AE5D', // Brass
};

const TYPE_NAMES: Record<string, string> = {
  stock: 'Stocks',
  crypto: 'Crypto',
  etf: 'ETFs',
  commodity: 'Commodities',
};

// Price update interval (60 seconds)
const PRICE_UPDATE_INTERVAL = 60000;

export function HoldingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  
  const priceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch holdings from Supabase
  const fetchHoldings = useCallback(async () => {
    if (!user) {
      setHoldings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform database records to Holding type
      const transformedHoldings: Holding[] = (data || []).map(item => {
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
          currentValue,
          totalCost,
          gain,
          gainPercent,
        };
      });

      setHoldings(transformedHoldings);
      
      // Fetch live prices after loading holdings
      if (transformedHoldings.length > 0) {
        await updatePrices(transformedHoldings);
      }
    } catch (err) {
      console.error('Error fetching holdings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update prices from APIs
  const updatePrices = useCallback(async (currentHoldings: Holding[]) => {
    if (currentHoldings.length === 0) return;

    setPricesLoading(true);

    try {
      const holdingsData = currentHoldings.map(h => ({
        symbol: h.symbol,
        type: h.type,
      }));

      const priceResults = await fetchMultiplePrices(holdingsData);

      // Update holdings with new prices
      const updatedHoldings = currentHoldings.map(holding => {
        const priceData = priceResults.get(holding.symbol.toUpperCase());
        
        if (priceData && !('error' in priceData)) {
          const currentPrice = priceData.price;
          const dayChangePercent = priceData.changePercent;
          const currentValue = holding.quantity * currentPrice;
          const totalCost = holding.quantity * holding.purchasePrice;
          const gain = currentValue - totalCost;
          const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

          return {
            ...holding,
            name: priceData.name || holding.name,
            currentPrice,
            dayChangePercent,
            currentValue,
            gain,
            gainPercent,
          };
        }
        
        return holding;
      });

      setHoldings(updatedHoldings);
      setLastPriceUpdate(new Date());

      // Update prices in database (background, don't await)
      updatePricesInDatabase(updatedHoldings);
    } catch (err) {
      console.error('Error updating prices:', err);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  // Update prices in Supabase (background task)
  const updatePricesInDatabase = async (updatedHoldings: Holding[]) => {
    if (!user) return;

    try {
      for (const holding of updatedHoldings) {
        await supabase
          .from('holdings')
          .update({
            current_price: holding.currentPrice,
            day_change_percent: holding.dayChangePercent,
            name: holding.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', holding.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error updating prices in database:', err);
    }
  };

  // Refresh prices manually
  const refreshPrices = useCallback(async () => {
    await updatePrices(holdings);
  }, [holdings, updatePrices]);

  // Fetch holdings when user changes
  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  // Set up automatic price refresh
  useEffect(() => {
    if (holdings.length > 0) {
      priceIntervalRef.current = setInterval(() => {
        updatePrices(holdings);
      }, PRICE_UPDATE_INTERVAL);
    }

    return () => {
      if (priceIntervalRef.current) {
        clearInterval(priceIntervalRef.current);
      }
    };
  }, [holdings.length, updatePrices]);

  // Add a new holding
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

      // Add to local state
      const currentValue = data.quantity * data.current_price;
      const totalCost = data.quantity * data.purchase_price;
      const gain = currentValue - totalCost;
      const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

      const newHolding: Holding = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        type: data.type,
        quantity: parseFloat(data.quantity),
        purchasePrice: parseFloat(data.purchase_price),
        currentPrice: parseFloat(data.current_price),
        dayChangePercent: parseFloat(data.day_change_percent || 0),
        currentValue,
        totalCost,
        gain,
        gainPercent,
      };

      setHoldings(prev => [newHolding, ...prev]);
    } catch (err) {
      console.error('Error adding holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to add holding');
      throw err;
    }
  }, [user]);

  // Remove a holding
  const removeHolding = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('holdings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setHoldings(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Error removing holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove holding');
      throw err;
    }
  }, [user]);

  // Update a holding
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

      const { error: updateError } = await supabase
        .from('holdings')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setHoldings(prev => prev.map(h => {
        if (h.id !== id) return h;

        const updated = { ...h, ...updates };
        updated.currentValue = updated.quantity * updated.currentPrice;
        updated.totalCost = updated.quantity * updated.purchasePrice;
        updated.gain = updated.currentValue - updated.totalCost;
        updated.gainPercent = updated.totalCost > 0 ? (updated.gain / updated.totalCost) * 100 : 0;

        return updated;
      }));
    } catch (err) {
      console.error('Error updating holding:', err);
      setError(err instanceof Error ? err.message : 'Failed to update holding');
      throw err;
    }
  }, [user]);

  // Refresh holdings
  const refreshHoldings = useCallback(async () => {
    await fetchHoldings();
  }, [fetchHoldings]);

  // Calculate metrics
  const metrics = useMemo<PortfolioMetrics>(() => {
    if (holdings.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
      };
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Calculate day change
    const dayChange = holdings.reduce((sum, h) => {
      const previousValue = h.currentValue / (1 + h.dayChangePercent / 100);
      return sum + (h.currentValue - previousValue);
    }, 0);
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
    };
  }, [holdings]);

  // Calculate allocations
  const allocations = useMemo<Allocation[]>(() => {
    const types = ['stock', 'crypto', 'etf', 'commodity'];
    
    return types.map(type => {
      const value = holdings
        .filter(h => h.type === type)
        .reduce((sum, h) => sum + h.currentValue, 0);
      
      return {
        name: TYPE_NAMES[type],
        value,
        percent: metrics.totalValue > 0 ? Math.round((value / metrics.totalValue) * 100) : 0,
        color: TYPE_COLORS[type],
      };
    });
  }, [holdings, metrics.totalValue]);

  return (
    <HoldingsContext.Provider
      value={{
        holdings,
        metrics,
        allocations,
        loading,
        pricesLoading,
        error,
        lastPriceUpdate,
        addHolding,
        removeHolding,
        updateHolding,
        refreshHoldings,
        refreshPrices,
      }}
    >
      {children}
    </HoldingsContext.Provider>
  );
}

export function useHoldings() {
  const context = useContext(HoldingsContext);
  if (context === undefined) {
    throw new Error('useHoldings must be used within a HoldingsProvider');
  }
  return context;
}
