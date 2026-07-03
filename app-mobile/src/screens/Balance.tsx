// Tela de saldo/cashback. Usa o tema dinâmico vindo do Postgres via
// useTheme() (ThemeContext.tsx) e os endpoints reais do backend
// (accountApi.ts). Pull-to-refresh incluso.
//
// NOTA sobre auth: o accountController.ts hoje ainda cai num
// DEMO_USER ('user1') quando o id bate com ele. Assim que a
// autenticação real estiver plugada no app, troque a prop `userId`
// abaixo pelo id vindo do seu contexto/hook de auth.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getPalette } from '../theme/palettes';
import {
  getBalance,
  getTransactions,
  BalanceResponse,
  TransactionResponse,
} from '../services/accountApi';

type Props = {
  userId?: string;
};

function formatCoins(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const TX_LABELS: Record<string, string> = {
  CREDIT_PURCHASE: 'Compra de créditos',
  MACHINE_UNLOCK: 'Uso em máquina',
};

export default function BalanceScreen({ userId = 'user1' }: Props) {
  const { theme, isLoading: themeLoading } = useTheme();
  const palette = getPalette(theme);
  const styles = makeStyles(palette);

  const [account, setAccount] = useState<BalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [balanceRes, txRes] = await Promise.all([
        getBalance(userId),
        getTransactions(userId),
      ]);
      setAccount(balanceRes);
      setTransactions(txRes);
    } catch (err) {
      console.warn(err);
      setError('Não foi possível carregar seu saldo agora.');
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading || themeLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (error && !account) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={() => { setLoading(true); loadData().finally(() => setLoading(false)); }}>
          Tentar novamente
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.primary} />
      }
      ListHeaderComponent={
        <>
          <Text style={styles.header}>SALDO</Text>

          <View style={styles.card} accessibilityLabel="Cartão de saldo e cashback">
            <Text style={styles.label}>Saldo disponível</Text>
            <Text style={styles.balanceValue}>{formatCoins(account?.balance ?? 0)}</Text>
            <Text style={styles.coinsSuffix}>moedas</Text>

            <View style={styles.divider} />

            <View style={styles.cashbackRow}>
              <Text style={styles.label}>Cashback acumulado</Text>
              <Text style={styles.cashbackValue}>
                {formatCoins(account?.cashback ?? 0)} moedas
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Histórico recente</Text>
        </>
      }
      data={transactions}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={
        <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.txCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txTitle}>{TX_LABELS[item.type] ?? item.type}</Text>
            {item.machine_id ? (
              <Text style={styles.txSubtitle}>Máquina: {item.machine_id}</Text>
            ) : null}
            <Text style={styles.txSubtitle}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.txAmount}>{formatCoins(item.amount)}</Text>
        </View>
      )}
    />
  );
}

function makeStyles(palette: ReturnType<typeof getPalette>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.background },
    listContent: { padding: 16, paddingBottom: 32 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 18,
      color: palette.text,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 18,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 3,
    },
    label: { color: palette.softText, fontSize: 14 },
    balanceValue: {
      marginTop: 6,
      fontSize: 40,
      fontWeight: '800',
      color: palette.primary,
    },
    coinsSuffix: { color: palette.softText, marginBottom: 4 },
    divider: {
      height: 1,
      backgroundColor: palette.cardAlt,
      marginVertical: 14,
    },
    cashbackRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cashbackValue: { fontSize: 16, fontWeight: '700', color: palette.accent },
    sectionTitle: {
      marginTop: 24,
      marginBottom: 12,
      fontSize: 16,
      fontWeight: '700',
      color: palette.text,
    },
    emptyText: { color: palette.softText, textAlign: 'center', marginTop: 12 },
    txCard: {
      backgroundColor: palette.card,
      padding: 14,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    txTitle: { fontSize: 14, fontWeight: '700', color: palette.text },
    txSubtitle: { marginTop: 4, color: palette.softText, fontSize: 12 },
    txAmount: { fontSize: 16, fontWeight: '800', color: palette.primary },
    errorText: { color: palette.danger, textAlign: 'center', marginBottom: 12, paddingHorizontal: 24 },
    retryText: { color: palette.primary, fontWeight: '700' },
  });
}