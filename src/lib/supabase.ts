import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder-key';

const memoryStorage = new Map<string, string>();
const serverStorage = {
  getItem: async (key: string) => memoryStorage.get(key) ?? null,
  setItem: async (key: string, value: string) => { memoryStorage.set(key, value); },
  removeItem: async (key: string) => { memoryStorage.delete(key); },
};
const isBrowser = Platform.OS === 'web' && typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Platform.OS === 'web' && !isBrowser ? serverStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

export const isSupabaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
