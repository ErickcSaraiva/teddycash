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

    const inTabs = segments[0] === '(tabs)';

    if (!token && inTabs) {
      router.replace('/login');
      return;
    }

    if (token && !inTabs) {
      router.replace('/home');
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