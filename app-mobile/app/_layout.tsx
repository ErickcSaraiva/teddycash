import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider as LiveOpsThemeProvider } from '@/src/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LiveOpsThemeProvider>
      <NavigationThemeProvider
        value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <Stack>
          <Stack.Screen 
            name="login" 
            options={{ headerShown:false }} 
          />

          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown:false }} 
          />

          <Stack.Screen 
            name="modal" 
            options={{
              presentation:'modal',
              title:'Modal'
            }}
          />

        </Stack>

        <StatusBar style="auto" />

      </NavigationThemeProvider>
    </LiveOpsThemeProvider>
  );
}