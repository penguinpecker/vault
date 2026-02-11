// VAULT - Price Alerts Context
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

interface AlertsContextType {
  alerts: PriceAlert[];
  loading: boolean;
  error: string | null;
  fetchAlerts: () => Promise<void>;
  addAlert: (alert: Omit<PriceAlert, 'id' | 'isActive' | 'triggeredAt' | 'createdAt'>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  toggleAlert: (id: string) => Promise<void>;
  checkAlerts: (prices: Map<string, number>) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());

  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: PriceAlert[] = (data || []).map(item => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        targetPrice: parseFloat(item.target_price),
        condition: item.condition,
        isActive: item.is_active,
        triggeredAt: item.triggered_at,
        createdAt: item.created_at,
      }));

      setAlerts(mapped);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addAlert = useCallback(async (
    alert: Omit<PriceAlert, 'id' | 'isActive' | 'triggeredAt' | 'createdAt'>
  ) => {
    if (!user) return;

    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          symbol: alert.symbol.toUpperCase(),
          name: alert.name,
          target_price: alert.targetPrice,
          condition: alert.condition,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newAlert: PriceAlert = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        targetPrice: parseFloat(data.target_price),
        condition: data.condition,
        isActive: data.is_active,
        triggeredAt: data.triggered_at,
        createdAt: data.created_at,
      };

      setAlerts(prev => [newAlert, ...prev]);
    } catch (err) {
      console.error('Error adding alert:', err);
      setError(err instanceof Error ? err.message : 'Failed to add alert');
      throw err;
    }
  }, [user]);

  const deleteAlert = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setAlerts(prev => prev.filter(a => a.id !== id));
      triggeredRef.current.delete(id);
    } catch (err) {
      console.error('Error deleting alert:', err);
      throw err;
    }
  }, [user]);

  const toggleAlert = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const alert = alerts.find(a => a.id === id);
      if (!alert) return;

      const newActive = !alert.isActive;

      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({
          is_active: newActive,
          triggered_at: newActive ? null : alert.triggeredAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAlerts(prev => prev.map(a =>
        a.id === id ? { ...a, isActive: newActive, triggeredAt: newActive ? null : a.triggeredAt } : a
      ));

      if (newActive) {
        triggeredRef.current.delete(id);
      }
    } catch (err) {
      console.error('Error toggling alert:', err);
      throw err;
    }
  }, [user, alerts]);

  // Check if any alerts should trigger based on current prices
  const checkAlerts = useCallback((prices: Map<string, number>) => {
    const activeAlerts = alerts.filter(a => a.isActive);

    for (const alert of activeAlerts) {
      // Don't trigger same alert twice in one session
      if (triggeredRef.current.has(alert.id)) continue;

      const currentPrice = prices.get(alert.symbol.toUpperCase());
      if (currentPrice === undefined) continue;

      let triggered = false;
      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        triggeredRef.current.add(alert.id);

        // Show in-app alert
        const direction = alert.condition === 'above' ? 'above' : 'below';
        const symbol = '$';
        Alert.alert(
          '🔔 Price Alert',
          `${alert.name} (${alert.symbol}) is now ${direction} ${symbol}${alert.targetPrice.toFixed(2)}\nCurrent price: ${symbol}${currentPrice.toFixed(2)}`,
          [
            { text: 'Dismiss' },
            {
              text: 'Deactivate',
              onPress: async () => {
                try {
                  await supabase
                    .from('price_alerts')
                    .update({
                      is_active: false,
                      triggered_at: new Date().toISOString(),
                    })
                    .eq('id', alert.id);

                  setAlerts(prev => prev.map(a =>
                    a.id === alert.id
                      ? { ...a, isActive: false, triggeredAt: new Date().toISOString() }
                      : a
                  ));
                } catch (err) {
                  console.error('Error deactivating alert:', err);
                }
              },
            },
          ]
        );
      }
    }
  }, [alerts]);

  // Fetch alerts when user logs in
  useEffect(() => {
    if (user) {
      fetchAlerts();
    } else {
      setAlerts([]);
    }
  }, [user, fetchAlerts]);

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        loading,
        error,
        fetchAlerts,
        addAlert,
        deleteAlert,
        toggleAlert,
        checkAlerts,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
