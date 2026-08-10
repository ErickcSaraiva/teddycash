import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

function browserStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const storage = browserStorage();
    if (Platform.OS === 'web') return storage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const storage = browserStorage();
    if (Platform.OS === 'web') {
      storage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const storage = browserStorage();
    if (Platform.OS === 'web') {
      storage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

