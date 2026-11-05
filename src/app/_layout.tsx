import { DarkTheme, DefaultTheme, ThemeProvider, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import AuthScreen from '@/app/auth';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    }).catch(() => {
      setSession(null);
    }).finally(() => {
      setSessionLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    const isAuthRoute = segments[0] === 'auth';
    if (!session && !isAuthRoute) router.replace('/auth');
    if (session && isAuthRoute) router.replace('/');
  }, [segments, session, sessionLoading]);

  if (sessionLoading) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {session ? <AppTabs /> : <AuthScreen />}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#f7f5ef',
  },
});
