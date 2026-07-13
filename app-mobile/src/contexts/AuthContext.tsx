import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthContextData {
  token: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredData() {
      const storedToken = await SecureStore.getItemAsync('teddycash_token');
      if (storedToken) {
        setToken(storedToken);
      }
      setIsLoading(false);
    }
    loadStoredData();
  }, []);

  async function signIn(token: string) {
    await SecureStore.setItemAsync('teddycash_token', token);
    setToken(token);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('teddycash_token');
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}