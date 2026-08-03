import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/authApi';
import { getWallet, type Wallet } from '../services/economyApi';

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
  logout: () => Promise<void>;
  refreshWallet: () => Promise<Wallet | null>;
  refreshBalance: () => Promise<number | null>;
  updateProfile: (data: { username?: string; email?: string; avatarUrl?: string | null }) => Promise<void>;
}
const initialState: AuthState = { token: null, userId: null, username: null, email: null, avatarUrl: null, balance: null, teddyCoins: null, loading: true, refreshing: false };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const persistWallet = useCallback(async (wallet: Wallet) => {
    await Promise.all([
      SecureStore.setItemAsync(KEY_BALANCE, String(wallet.credits)),
      SecureStore.setItemAsync(KEY_TEDDY_COINS, String(wallet.teddy_coins)),
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [token, userId, cachedCredits, cachedCoins] = await Promise.all([
          SecureStore.getItemAsync(KEY_TOKEN), SecureStore.getItemAsync(KEY_USER_ID),
          SecureStore.getItemAsync(KEY_BALANCE), SecureStore.getItemAsync(KEY_TEDDY_COINS),
        ]);
        if (!token || !userId) { if (mounted.current) setState({ ...initialState, loading: false }); return; }
        if (mounted.current) setState((s) => ({ ...s, token, userId, balance: cachedCredits ? Number(cachedCredits) : null, teddyCoins: cachedCoins ? Number(cachedCoins) : null }));
        const [profile, wallet] = await Promise.all([authApi.getProfile(userId, token), getWallet()]);
        if (mounted.current) setState({ token, userId, username: profile.username, email: profile.email, avatarUrl: profile.avatarUrl ?? null, balance: wallet.credits, teddyCoins: wallet.teddy_coins, loading: false, refreshing: false });
        await persistWallet(wallet);
      } catch {
        await Promise.all([SecureStore.deleteItemAsync(KEY_TOKEN), SecureStore.deleteItemAsync(KEY_USER_ID)]).catch(() => {});
        if (mounted.current) setState({ ...initialState, loading: false });
      }
    })();
  }, [persistWallet]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    if (!session.token || !session.userId) throw new Error('Falha ao salvar sessão.');
    const [profile, wallet] = await Promise.all([authApi.getProfile(session.userId, session.token), getWallet()]);
    if (mounted.current) setState({ token: session.token, userId: session.userId, username: profile.username, email: profile.email, avatarUrl: profile.avatarUrl ?? null, balance: wallet.credits, teddyCoins: wallet.teddy_coins, loading: false, refreshing: false });
    await persistWallet(wallet);
  }, [persistWallet]);

  const logout = useCallback(async () => {
    await Promise.all([SecureStore.deleteItemAsync(KEY_TOKEN), SecureStore.deleteItemAsync(KEY_USER_ID), SecureStore.deleteItemAsync(KEY_BALANCE), SecureStore.deleteItemAsync(KEY_TEDDY_COINS)]).catch(() => {});
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

  const updateProfile = useCallback(async (data: { username?: string; email?: string; avatarUrl?: string | null }) => {
    if (!state.token || !state.userId) throw new Error('Usuário não autenticado.');
    const profile = await authApi.updateProfile(state.userId, data, state.token);
    if (mounted.current) setState((s) => ({ ...s, username: profile.username, email: profile.email, avatarUrl: profile.avatarUrl ?? null }));
  }, [state.token, state.userId]);

  return <AuthContext.Provider value={{ ...state, login, logout, refreshWallet, refreshBalance, updateProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth deve ser usado dentro de <AuthProvider>'); return value; }
