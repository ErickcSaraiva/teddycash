// mobile-ts/src/context/AuthContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from './authApi';

// ── Chaves do SecureStore ─────────────────────────────────────────────────────
const KEY_TOKEN   = 'teddycash_token';
const KEY_USER_ID = 'teddycash_user_id';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface AuthState {
  token:   string | null;
  userId:  string | null;
  balance: number | null;
  loading: boolean;      // true durante o boot (verificar sessão salva)
  refreshing: boolean;   // true durante chamadas de saldo
}

interface AuthContextValue extends AuthState {
  login:          (email: string, password: string) => Promise<void>;
  logout:         () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token:      null,
    userId:     null,
    balance:    null,
    loading:    true,   // começa true; vira false depois do boot
    refreshing: false,
  });

  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  // ── Boot: restaurar sessão salva ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [token, userId] = await Promise.all([
          SecureStore.getItemAsync(KEY_TOKEN),
          SecureStore.getItemAsync(KEY_USER_ID),
        ]);

        if (token && userId && mounted.current) {
          // Sessão encontrada — busca saldo imediatamente
          const { balance } = await authApi.getBalance(userId, token);
          if (mounted.current) {
            setState({ token, userId, balance, loading: false, refreshing: false });
          }
        } else if (mounted.current) {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch {
        // Token expirado ou backend offline — limpa sessão
        await SecureStore.deleteItemAsync(KEY_TOKEN).catch(() => {});
        await SecureStore.deleteItemAsync(KEY_USER_ID).catch(() => {});
        if (mounted.current) setState((s) => ({ ...s, loading: false }));
      }
    })();
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { access_token, user_id } = await authApi.login(email, password);

    // Salva no SecureStore
    await SecureStore.setItemAsync(KEY_TOKEN, access_token);
    await SecureStore.setItemAsync(KEY_USER_ID, user_id);

    // Busca saldo logo depois
    const { balance } = await authApi.getBalance(user_id, access_token);

    if (mounted.current) {
      setState({ token: access_token, userId: user_id, balance, loading: false, refreshing: false });
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(KEY_TOKEN).catch(() => {});
    await SecureStore.deleteItemAsync(KEY_USER_ID).catch(() => {});
    if (mounted.current) {
      setState({ token: null, userId: null, balance: null, loading: false, refreshing: false });
    }
  }, []);

  // ── refreshBalance ────────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    const { token, userId } = state;
    if (!token || !userId) return;

    setState((s) => ({ ...s, refreshing: true }));
    try {
      const { balance } = await authApi.getBalance(userId, token);
      if (mounted.current) setState((s) => ({ ...s, balance, refreshing: false }));
    } catch {
      if (mounted.current) setState((s) => ({ ...s, refreshing: false }));
    }
  }, [state.token, state.userId]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}