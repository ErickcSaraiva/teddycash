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
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const isAuthRoute = segments[0] === 'login' || segments[0] === 'register';

const isProtectedRoute =
  segments[0] === '(tabs)' ||
  segments[0] === 'transfer' ||
  segments[0] === 'transfer-confirm' ||
  segments[0] === 'transactions' ||
  segments[0] === 'add-credits' ||
  segments[0] === 'payment-order';

if (!token && isProtectedRoute) {
  router.replace('/login');
  return;
}

if (token && isAuthRoute) {
  router.replace('/(tabs)/home');
  return;
}

  }, [token, loading, segments, router]);

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
