import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // The auth state listener in AuthContext will handle the session
    // Just wait a moment and redirect
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth/signin');
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.black.rich }}>
      <ActivityIndicator size="large" color={theme.colors.gold.primary} />
    </View>
  );
}
