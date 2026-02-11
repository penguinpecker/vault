// VAULT - Root Layout with All Providers, Auth Protection & Biometric Lock
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { theme } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ProfileProvider } from '../context/ProfileContext';
import { HoldingsProvider, useHoldings } from '../context/HoldingsContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { TransactionProvider } from '../context/TransactionContext';
import { AlertsProvider, useAlerts } from '../context/AlertsContext';

const BIOMETRIC_KEY = 'vault_biometric_enabled';

// ============================================
// BIOMETRIC LOCK GATE
// ============================================
function BiometricGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const appStateRef = useRef(AppState.currentState);

  const authenticate = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock VAULT',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLocked(false);
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
    }
  }, []);

  // Check biometric on app launch
  useEffect(() => {
    const checkBiometric = async () => {
      if (!user) { setChecking(false); return; }

      try {
        const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);
        if (enabled === 'true') {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();

          if (compatible && enrolled) {
            setLocked(true);
            setChecking(false);
            await authenticate();
            return;
          }
        }
      } catch (err) {
        console.error('Biometric check error:', err);
      }
      setChecking(false);
    };

    checkBiometric();
  }, [user, authenticate]);

  // Re-lock when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (!user) return;
        try {
          const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);
          if (enabled === 'true') {
            setLocked(true);
            await authenticate();
          }
        } catch {}
      }
      appStateRef.current = nextState;
    });

    return () => sub?.remove();
  }, [user, authenticate]);

  if (checking) {
    return (
      <View style={styles.lockContainer}>
        <ActivityIndicator color={theme.colors.gold.primary} size="large" />
      </View>
    );
  }

  if (locked && user) {
    return (
      <View style={styles.lockContainer}>
        <View style={styles.lockIcon}>
          <View style={styles.lockInner} />
        </View>
        <Text style={styles.lockTitle}>VAULT is Locked</Text>
        <Text style={styles.lockSubtitle}>Authenticate to continue</Text>
        <TouchableOpacity style={styles.unlockButton} onPress={authenticate}>
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

// ============================================
// ALERT CHECKER - checks alerts on price updates
// ============================================
function AlertChecker({ children }: { children: React.ReactNode }) {
  const { getCurrentPriceMap, lastPriceUpdate } = useHoldings();
  const { checkAlerts } = useAlerts();

  useEffect(() => {
    if (lastPriceUpdate) {
      const priceMap = getCurrentPriceMap();
      if (priceMap.size > 0) {
        checkAlerts(priceMap);
      }
    }
  }, [lastPriceUpdate, getCurrentPriceMap, checkAlerts]);

  return <>{children}</>;
}

// ============================================
// AUTH GUARD
// ============================================
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/signin');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoIcon}>
          <View style={styles.logoInner} />
        </View>
        <ActivityIndicator color={theme.colors.gold.primary} size="large" style={styles.spinner} />
      </View>
    );
  }

  return <>{children}</>;
}

// ============================================
// ROOT LAYOUT NAV
// ============================================
function RootLayoutNav() {
  return (
    <AuthGuard>
      <BiometricGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.black.rich },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen
            name="asset/add"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </BiometricGate>
    </AuthGuard>
  );
}

// ============================================
// MAIN LAYOUT with all providers
// ============================================
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProfileProvider>
            <CurrencyProvider>
              <HoldingsProvider>
                <TransactionProvider>
                  <AlertsProvider>
                    <AlertChecker>
                      <StatusBar style="light" />
                      <RootLayoutNav />
                    </AlertChecker>
                  </AlertsProvider>
                </TransactionProvider>
              </HoldingsProvider>
            </CurrencyProvider>
          </ProfileProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.black.rich,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: theme.colors.gold.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  logoInner: {
    width: 24, height: 24,
    backgroundColor: theme.colors.black.pure,
    transform: [{ rotate: '45deg' }],
  },
  spinner: { marginTop: 8 },
  lockContainer: {
    flex: 1,
    backgroundColor: theme.colors.black.rich,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockIcon: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: theme.colors.gold.subtle,
    borderWidth: 2, borderColor: theme.colors.gold.dark,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  lockInner: {
    width: 28, height: 28,
    backgroundColor: theme.colors.gold.primary,
    transform: [{ rotate: '45deg' }],
  },
  lockTitle: {
    fontSize: 22, fontWeight: '700',
    color: theme.colors.white.pure, marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 14, color: theme.colors.grey[500], marginBottom: 32,
  },
  unlockButton: {
    paddingVertical: 14, paddingHorizontal: 48,
    backgroundColor: theme.colors.gold.primary,
    borderRadius: 12,
  },
  unlockText: {
    fontSize: 16, fontWeight: '600', color: theme.colors.black.pure,
  },
});
