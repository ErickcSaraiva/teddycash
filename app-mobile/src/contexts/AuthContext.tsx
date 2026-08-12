import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authService } from '../services/auth';
import { getWallet, type Wallet } from '../services/economyApi';
import { sessionStorage } from '../services/sessionStorage';
import { ApiError } from '../services/api';

const KEY_TOKEN = 'teddycash_token';
const KEY_USER_ID = 'teddycash_user_id';
const KEY_BALANCE = 'teddycash_balance';
const KEY_TEDDY_COINS = 'teddycash_teddy_coins';

interface AuthState {
  token: string | null; userId: string | null; username: string | null; email: string | null;
  avatarUrl: string | null; balance: number | null; teddyCoins: number | null; loading: boolean; refreshing: boolean;
}
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshWallet: () => Promise<Wallet | null>;
  refreshBalance: () => Promise<number | null>;
  updateProfile: (data: { username?: string; email?: string; avatarUrl?: string | null; password?: string }) => Promise<void>;
}
const initialState: AuthState = { token: null, userId: null, username: null, email: null, avatarUrl: null, balance: null, teddyCoins: null, loading: true, refreshing: false };
const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEYS = [KEY_TOKEN, KEY_USER_ID, KEY_BALANCE, KEY_TEDDY_COINS] as const;

async function clearStoredSession() {
  await Promise.all(SESSION_KEYS.map((key) => sessionStorage.removeItem(key)));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const persistWallet = useCallback(async (wallet: Wallet) => {
    await Promise.all([
      sessionStorage.setItem(KEY_BALANCE, String(wallet.credits)),
      sessionStorage.setItem(KEY_TEDDY_COINS, String(wallet.teddy_coins)),
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [token, userId, cachedCredits, cachedCoins] = await Promise.all([
          sessionStorage.getItem(KEY_TOKEN), sessionStorage.getItem(KEY_USER_ID),
          sessionStorage.getItem(KEY_BALANCE), sessionStorage.getItem(KEY_TEDDY_COINS),
        ]);
        if (!token || !userId) { if (mounted.current) setState({ ...initialState, loading: false }); return; }
        if (mounted.current) setState((s) => ({ ...s, token, userId, balance: cachedCredits ? Number(cachedCredits) : null, teddyCoins: cachedCoins ? Number(cachedCoins) : null }));
        const [profile, wallet] = await Promise.all([authService.getProfile(userId, token), getWallet()]);
        if (mounted.current) setState({ token, userId, username: profile.username, email: profile.email, avatarUrl: profile.avatarUrl ?? null, balance: wallet.credits, teddyCoins: wallet.teddy_coins, loading: false, refreshing: false });
        await persistWallet(wallet);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearStoredSession().catch(() => {});
          if (mounted.current) setState({ ...initialState, loading: false });
          return;
        }
        // Uma API temporariamente indisponível não invalida credenciais locais.
        if (mounted.current) setState((current) => ({ ...current, loading: false, refreshing: false }));
      }
    })();
  }, [persistWallet]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authService.login(email, password);
    if (!session.token || !session.userId) throw new Error('Falha ao salvar sessão.');
    await authService.persistSession(session.token, session.userId);
    try {
      const [profile, wallet] = await Promise.all([authService.getProfile(session.userId, session.token), getWallet()]);
      if (mounted.current) setState({ token: session.token, userId: session.userId, username: profile.username, email: profile.email, avatarUrl: profile.avatarUrl ?? null, balance: wallet.credits, teddyCoins: wallet.teddy_coins, loading: false, refreshing: false });
      await persistWallet(wallet);
    } catch (error) {
      await clearStoredSession();
      throw error;
    }
  }, [persistWallet]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    await authService.register(username, email, password);
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    await clearStoredSession().catch(() => {});
    if (mounted.current) setState({ ...initialState, loading: false });
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!state.token) return null;
    if (mounted.current) setState((s) => ({ ...s, refreshing: true }));
    try {
      const wallet = await getWallet();
      if (mounted.current) setState((s) => ({ ...s, balance: wallet.credits, teddyCoins: wallet.teddy_coins }));
      await persistWallet(wallet);
      return wallet;
    } finally { if (mounted.current) setState((s) => ({ ...s, refreshing: false })); }
  }, [persistWallet, state.token]);
  const refreshBalance = useCallback(async () => (await refreshWallet())?.credits ?? null, [refreshWallet]);

  const updateProfile = useCallback(async (data: { username?: string; email?: string; avatarUrl?: string | null; password?: string }) => {
    if (!state.token || !state.userId) throw new Error('Usuário não autenticado.');
    const profile = await authService.updateProfile(state.userId, data);
    if (mounted.current) setState((s) => ({ ...s, username: profile.username, email: profile.email, avatarUrl: profile.avatarUrl ?? null }));
  }, [state.token, state.userId]);

  return <AuthContext.Provider value={{ ...state, login, register, logout, refreshWallet, refreshBalance, updateProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth deve ser usado dentro de <AuthProvider>'); return value; }
