// VAULT - Settings Screen (Dynamic with Supabase)
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useHoldings } from '../../context/HoldingsContext';

// Icons
const UserIcon = ({ color = '#fff', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M20 21a8 8 0 00-16 0" />
  </Svg>
);

const DollarIcon = ({ color = '#fff', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="1" x2="12" y2="23" />
    <Path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </Svg>
);

const EyeOffIcon = ({ color = '#fff', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

const BellIcon = ({ color = '#fff', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" />
  </Svg>
);

const ShieldIcon = ({ color = '#fff', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

const TrashIcon = ({ color = '#fff', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </Svg>
);

const LogOutIcon = ({ color = '#fff', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

const ChevronRightIcon = ({ color = '#6b7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const InfoIcon = ({ color = '#fff', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="16" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12.01" y2="8" />
  </Svg>
);

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { holdings, refreshHoldings } = useHoldings();
  
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleToggleHideBalance = async () => {
    if (!profile) return;
    
    setUpdating(true);
    try {
      await updateProfile({ hideBalance: !profile.hideBalance });
    } catch (err) {
      Alert.alert('Error', 'Failed to update setting');
    }
    setUpdating(false);
  };

  const handleChangeCurrency = async (currencyCode: string) => {
    if (!profile) return;
    
    setUpdating(true);
    try {
      await updateProfile({ currency: currencyCode as any });
      setShowCurrencyPicker(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update currency');
    }
    setUpdating(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Please contact support@vaultapp.com to delete your account.');
          },
        },
      ]
    );
  };

  const currentCurrency = CURRENCIES.find(c => c.code === profile?.currency) || CURRENCIES[0];

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.gold.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <UserIcon color={theme.colors.gold.primary} size={32} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.fullName || 'User'}</Text>
            <Text style={styles.profileEmail}>{profile?.email || user?.email}</Text>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{holdings.length}</Text>
              <Text style={styles.statLabel}>Assets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Currency */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          >
            <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.gold.primary}20` }]}>
              <DollarIcon color={theme.colors.gold.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingValue}>{currentCurrency.code} ({currentCurrency.symbol})</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Currency Picker */}
          {showCurrencyPicker && (
            <View style={styles.pickerContainer}>
              {CURRENCIES.map(currency => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.pickerItem,
                    profile?.currency === currency.code && styles.pickerItemActive,
                  ]}
                  onPress={() => handleChangeCurrency(currency.code)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    profile?.currency === currency.code && styles.pickerItemTextActive,
                  ]}>
                    {currency.symbol} {currency.name}
                  </Text>
                  {profile?.currency === currency.code && (
                    <View style={styles.checkmark} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Hide Balance */}
          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.silver.primary}20` }]}>
              <EyeOffIcon color={theme.colors.silver.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Hide Balance</Text>
              <Text style={styles.settingDescription}>Hide values on home screen</Text>
            </View>
            <Switch
              value={profile?.hideBalance || false}
              onValueChange={handleToggleHideBalance}
              trackColor={{ false: theme.colors.grey[800], true: theme.colors.gold.primary }}
              thumbColor={theme.colors.white.pure}
              disabled={updating}
            />
          </View>
        </Animated.View>

        {/* Notifications Section */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.copper.primary}20` }]}>
              <BellIcon color={theme.colors.copper.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Price Alerts</Text>
              <Text style={styles.settingDescription}>Get notified of price changes</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => Alert.alert('Coming Soon', 'Price alerts will be available in a future update.')}
              trackColor={{ false: theme.colors.grey[800], true: theme.colors.gold.primary }}
              thumbColor={theme.colors.white.pure}
            />
          </View>
        </Animated.View>

        {/* Security Section */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Coming Soon', 'Biometric authentication will be available in a future update.')}
          >
            <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.brass.primary}20` }]}>
              <ShieldIcon color={theme.colors.brass.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Biometric Lock</Text>
              <Text style={styles.settingDescription}>Use Face ID or fingerprint</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.grey[700]}` }]}>
              <InfoIcon color={theme.colors.grey[400]} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInUp.delay(700)}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleDeleteAccount}
          >
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <TrashIcon color="#ef4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Delete Account</Text>
              <Text style={styles.settingDescription}>Permanently delete your account</Text>
            </View>
            <ChevronRightIcon color="#ef4444" />
          </TouchableOpacity>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInUp.delay(800)}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOutIcon color={theme.colors.white.pure} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black.rich,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white.pure,
  },
  profileCard: {
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.gold.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gold.primary,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.grey[500],
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey[800],
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.grey[800],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.grey[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    marginBottom: 8,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.grey[500],
  },
  settingValue: {
    fontSize: 13,
    color: theme.colors.grey[400],
  },
  pickerContainer: {
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey[800],
  },
  pickerItemActive: {
    backgroundColor: `${theme.colors.gold.primary}10`,
  },
  pickerItemText: {
    fontSize: 14,
    color: theme.colors.grey[400],
  },
  pickerItemTextActive: {
    color: theme.colors.gold.primary,
    fontWeight: '500',
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.gold.primary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: theme.colors.grey[800],
    borderRadius: 12,
    marginTop: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
});
