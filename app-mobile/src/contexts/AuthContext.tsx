// app-mobile/src/contexts/AuthContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/authApi';

// ── Chaves do SecureStore ─────────────────────────────────────────────────────

const KEY_TOKEN   = 'teddycash_token';
const KEY_USER_ID = 'teddycash_user_id';
const KEY_BALANCE  = 'teddycash_balance';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AuthState {
  token:      string | null;
  userId:     string | null;
  username:   string | null;
  email:      string | null;
  avatarUrl:  string | null;
  balance:    number | null;
  /** true durante o boot (verificando sessão salva no SecureStore) */
  loading:    boolean;
  /** true durante chamadas de saldo após o boot */
  refreshing: boolean;
}

interface AuthContextValue extends AuthState {
  login:          (email: string, password: string) => Promise<void>;
  logout:         () => Promise<void>;
  refreshBalance: () => Promise<number | null>;
  updateProfile:  (data: { username?: string; email?: string; avatarUrl?: string | null }) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token:      null,
    userId:     null,
    username:   null,
    email:      null,
    avatarUrl:  null,
    balance:    null,
    loading:    true,   // começa true; vira false depois do boot
    refreshing: false,
  });

  // Evita setState em componente desmontado
  const mounted = useRef(true);
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // ── Boot: restaurar sessão salva ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [token, userId, cachedBalance] = await Promise.all([
          SecureStore.getItemAsync(KEY_TOKEN),
          SecureStore.getItemAsync(KEY_USER_ID),
          SecureStore.getItemAsync(KEY_BALANCE),
        ]);

        if (token && userId) {
          // Sessão encontrada — usa saldo em cache (se houver) imediatamente
          // para evitar mostrar zero enquanto a primeira requisição de rede falha.
          if (mounted.current && cachedBalance) {
            const parsed = Number(cachedBalance);
            setState((s) => ({ ...s, token, userId, balance: Number.isFinite(parsed) ? parsed : s.balance }));
          }

          // Busca perfil e saldo no backend (substitui o cache quando disponível)
          const [profile, balanceResponse] = await Promise.all([
            authApi.getProfile(userId, token),
            authApi.getBalance(userId, token),
          ]);

          if (mounted.current) {
            setState({
              token,
              userId,
              username: profile.username,
              email: profile.email,
              avatarUrl: profile.avatarUrl ?? null,
              balance: balanceResponse.balance,
              loading: false,
              refreshing: false,
            });
            // persistir saldo obtido
            await SecureStore.setItemAsync(KEY_BALANCE, String(balanceResponse.balance)).catch(() => {});
          }
        } else {
          if (mounted.current) setState((s) => ({ ...s, loading: false }));
        }
      } catch {
        // Token expirado ou backend offline — limpa sessão corrompida
        await SecureStore.deleteItemAsync(KEY_TOKEN).catch(() => {});
        await SecureStore.deleteItemAsync(KEY_USER_ID).catch(() => {});
        if (mounted.current) setState((s) => ({ ...s, loading: false }));
      }
    })();
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const { token, userId, username } = await authApi.login(email, password);

    if (!token || !userId) {
      throw new Error('Falha ao salvar sessão do usuário.');
    }

    let balance: number | null = null;
    let userEmail: string | null = null;
    let profileUsername: string | null = username ?? null;

    try {
      const [profile, balanceResponse] = await Promise.all([
        authApi.getProfile(userId, token),
        authApi.getBalance(userId, token),
      ]);
      balance = balanceResponse.balance;
      userEmail = profile.email;
      profileUsername = profile.username;
    } catch {
      balance = null;
    }

    if (mounted.current) {
      setState({
        token,
        userId,
        username: profileUsername,
        email: userEmail,
        avatarUrl: null,
        balance,
        loading: false,
        refreshing: false,
      });
      if (balance !== null) {
        await SecureStore.setItemAsync(KEY_BALANCE, String(balance)).catch(() => {});
      }
    }
  }, []);

  const updateProfile = useCallback(async (data: { username?: string; email?: string; avatarUrl?: string | null }) => {
    const { token, userId } = state;
    if (!token || !userId) {
      throw new Error('Usuário não autenticado.');
    }

    const profile = await authApi.updateProfile(userId, data, token);
    if (mounted.current) {
      setState((prev) => ({
        ...prev,
        username: profile.username,
        email: profile.email,
        avatarUrl: profile.avatarUrl ?? null,
      }));
    }
  }, [state.token, state.userId]);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(KEY_TOKEN).catch(() => {});
    await SecureStore.deleteItemAsync(KEY_USER_ID).catch(() => {});
    if (mounted.current) {
      setState({
        token: null,
        userId: null,
        username: null,
        email: null,
        avatarUrl: null,
        balance: null,
        loading: false,
        refreshing: false,
      });
    }
  }, []);

  // ── refreshBalance ────────────────────────────────────────────────────────
const refreshBalance = useCallback(async (): Promise<number | null> => {
  const { token, userId } = state;

  if (!token || !userId) return null;

  if (mounted.current) {
    setState((prev) => ({ ...prev, refreshing: true }));
  }

  try {
    const { balance } = await authApi.getBalance(userId, token);

    if (mounted.current) {
      setState((prev) => ({ ...prev, balance }));
      await SecureStore.setItemAsync(KEY_BALANCE, String(balance)).catch(() => {});
      return balance;
    }
    return null;
  } finally {
    if (mounted.current) {
      setState((prev) => ({ ...prev, refreshing: false }));
    }
  }
}, [state.token, state.userId]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshBalance, updateProfile }}>
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