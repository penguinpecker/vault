// VAULT - Currency Context for Price Conversion
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from './ProfileContext';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  rates: ExchangeRates;
  ratesLoading: boolean;
  convert: (amountUSD: number) => number;
  formatPrice: (amountUSD: number, compact?: boolean) => string;
  refreshRates: () => Promise<void>;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Cache rates for 1 hour
const RATE_CACHE_DURATION = 60 * 60 * 1000;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1 });
  const [ratesLoading, setRatesLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const lastCurrencyRef = useRef<string>('USD');

  const currency = profile?.currency || 'USD';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const fetchRates = useCallback(async () => {
    // Skip if USD (no conversion needed)
    if (currency === 'USD') {
      setRates({ USD: 1 });
      return;
    }

    // Skip if recently fetched for same currency
    const now = Date.now();
    if (
      now - lastFetchRef.current < RATE_CACHE_DURATION &&
      lastCurrencyRef.current === currency
    ) {
      return;
    }

    try {
      setRatesLoading(true);
      const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
      const data = await response.json();

      if (data.rates) {
        setRates(data.rates);
        lastFetchRef.current = now;
        lastCurrencyRef.current = currency;
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      // Use fallback rates
      setRates({
        USD: 1,
        GBP: 0.79,
        EUR: 0.92,
        JPY: 149.5,
        CAD: 1.36,
        AUD: 1.53,
      });
    } finally {
      setRatesLoading(false);
    }
  }, [currency]);

  // Fetch rates when currency changes
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Convert from USD to selected currency
  const convert = useCallback((amountUSD: number): number => {
    if (currency === 'USD') return amountUSD;
    const rate = rates[currency] || 1;
    return amountUSD * rate;
  }, [currency, rates]);

  // Format a USD amount in the selected currency
  const formatPrice = useCallback((amountUSD: number, compact: boolean = false): string => {
    const converted = convert(amountUSD);
    const sym = currencySymbol;

    if (compact && Math.abs(converted) >= 1000000) {
      const sign = converted < 0 ? '-' : '';
      return `${sign}${sym}${(Math.abs(converted) / 1000000).toFixed(1)}M`;
    }
    if (compact && Math.abs(converted) >= 1000) {
      const sign = converted < 0 ? '-' : '';
      return `${sign}${sym}${(Math.abs(converted) / 1000).toFixed(1)}k`;
    }

    // JPY doesn't use decimal places
    const decimals = currency === 'JPY' ? 0 : 2;

    const formatted = Math.abs(converted).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${converted < 0 ? '-' : ''}${sym}${formatted}`;
  }, [convert, currency, currencySymbol]);

  const refreshRates = useCallback(async () => {
    lastFetchRef.current = 0; // Force refresh
    await fetchRates();
  }, [fetchRates]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        rates,
        ratesLoading,
        convert,
        formatPrice,
        refreshRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
