import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router'; // Slot substitui o Stack aqui
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider as LiveOpsThemeProvider } from '@/src/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext'; // Importando seu novo AuthContext
import { useColorScheme } from '@/hooks/use-color-scheme';

// Componente responsável por proteger as rotas
function InitialLayout() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Espera o SecureStore carregar o token

    const inAuthGroup = segments[0] === '(tabs)';

    if (!token && inAuthGroup) {
      // Se não está logado e tenta ir para as abas, manda pro Login
      router.replace('/login');
    } else if (token && !inAuthGroup) {
      // Se está logado, garante que ele vá para a Home
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoading]);

  return <Slot />; // Renderiza as rotas automaticamente
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LiveOpsThemeProvider>
      <AuthProvider>
        <NavigationThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <InitialLayout />
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </AuthProvider>
    </LiveOpsThemeProvider>
  );
}