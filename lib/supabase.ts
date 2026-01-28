// VAULT - Supabase Client Configuration
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvvyektaktmbvciwyytt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dnlla3Rha3RtYnZjaXd5eXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTkwNDQsImV4cCI6MjA4NTEzNTA0NH0.fWuhK14nrnlo0X_k9nquKtsHin5AHy1V-Lgh1ADG_uc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
