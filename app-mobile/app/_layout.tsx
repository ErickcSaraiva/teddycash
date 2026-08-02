// app-mobile/app/_layout.tsx
import { useEffect } from 'react';
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
    const isTabsRoute = segments[0] === '(tabs)';

    if (!token && isTabsRoute) {
      router.replace('/login');
      return;
    }

    if (token && isAuthRoute) {
      router.replace('/home');
      return;
    }

    if (!token && segments[0] === undefined) {
      router.replace('/login');
    }
  }, [token, loading, segments, router]);

  if (loading) {
    return null;
  }

  return <Slot />;
}

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