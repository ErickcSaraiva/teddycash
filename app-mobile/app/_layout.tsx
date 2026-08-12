// app-mobile/app/_layout.tsx
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as LiveOpsThemeProvider } from '@/src/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';

function AppNavigator() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const rootSegment = segments[0] as string | undefined;
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const isAuthRoute = rootSegment === 'login' || rootSegment === 'register';

const isProtectedRoute =
  rootSegment === '(tabs)' ||
  rootSegment === 'transfer' ||
  rootSegment === 'transfer-confirm' ||
  rootSegment === 'transactions' ||
  rootSegment === 'coin-collector' ||
  rootSegment === 'add-credits' ||
  rootSegment === 'payment-order';

if (!token && isProtectedRoute) {
  router.replace('/login');
  return;
}

if (token && isAuthRoute) {
  router.replace('/(tabs)/home');
  return;
}

  }, [token, loading, rootSegment, router]);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#7C5CFC" /><Text style={styles.loadingText}>Carregando sua sessão...</Text></View>;
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1113', gap: 16 },
  loadingText: { color: '#F0F2F5', fontSize: 16 },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LiveOpsThemeProvider>
      <AuthProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </AuthProvider>
    </LiveOpsThemeProvider>
  );
} 
