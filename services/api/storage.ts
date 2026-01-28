// VAULT - Storage Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Holding, Currency } from './config';

const STORAGE_KEYS = {
  HOLDINGS: '@vault/holdings',
  SETTINGS: '@vault/settings',
  PRICE_CACHE: '@vault/price_cache',
};

export async function getHoldings(): Promise<Holding[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HOLDINGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading holdings:', error);
    return [];
  }
}

export async function saveHoldings(holdings: Holding[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
}

export async function addHolding(holding: Holding): Promise<Holding[]> {
  const holdings = await getHoldings();
  holdings.push(holding);
  await saveHoldings(holdings);
  return holdings;
}

export async function updateHolding(holdingId: string, updates: Partial<Holding>): Promise<Holding[]> {
  const holdings = await getHoldings();
  const index = holdings.findIndex(h => h.id === holdingId);
  if (index !== -1) {
    holdings[index] = { ...holdings[index], ...updates };
    await saveHoldings(holdings);
  }
  return holdings;
}

export async function deleteHolding(holdingId: string): Promise<Holding[]> {
  const holdings = await getHoldings();
  const filtered = holdings.filter(h => h.id !== holdingId);
  await saveHoldings(filtered);
  return filtered;
}

export interface AppSettings {
  currency: Currency;
  hideBalances: boolean;
  theme: 'dark' | 'light';
}

const DEFAULT_SETTINGS: AppSettings = { currency: 'USD', hideBalances: false, theme: 'dark' };

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

export async function getCachedPrices(): Promise<Record<string, any>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PRICE_CACHE);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
}

export async function cachePrices(prices: Record<string, any>): Promise<void> {
  const current = await getCachedPrices();
  const timestamp = Date.now();
  const updated = { ...current };
  for (const [id, priceData] of Object.entries(prices)) {
    updated[id] = { ...priceData, timestamp };
  }
  await AsyncStorage.setItem(STORAGE_KEYS.PRICE_CACHE, JSON.stringify(updated));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}

export default {
  getHoldings, saveHoldings, addHolding, updateHolding, deleteHolding,
  getSettings, saveSettings, getCachedPrices, cachePrices, generateId, clearAllData,
};
