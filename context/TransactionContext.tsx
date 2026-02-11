// VAULT - Transaction Context with Supabase Sync
import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  holdingId: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell' | 'dividend' | 'transfer_in' | 'transfer_out';
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  createdAt: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: (holdingId?: string) => Promise<Transaction[]>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (holdingId?: string): Promise<Transaction[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (holdingId) {
        query = query.eq('holding_id', holdingId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped: Transaction[] = (data || []).map(item => ({
        id: item.id,
        holdingId: item.holding_id,
        symbol: item.symbol,
        name: item.name,
        type: item.type,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.total),
        notes: item.notes,
        createdAt: item.created_at,
      }));

      setTransactions(mapped);
      return mapped;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          holding_id: tx.holdingId,
          symbol: tx.symbol.toUpperCase(),
          name: tx.name,
          type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          total: tx.total,
          notes: tx.notes,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newTx: Transaction = {
        id: data.id,
        holdingId: data.holding_id,
        symbol: data.symbol,
        name: data.name,
        type: data.type,
        quantity: parseFloat(data.quantity),
        price: parseFloat(data.price),
        total: parseFloat(data.total),
        notes: data.notes,
        createdAt: data.created_at,
      };

      setTransactions(prev => [newTx, ...prev]);
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      throw err;
    }
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    }
  }, [user]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        error,
        fetchTransactions,
        addTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
