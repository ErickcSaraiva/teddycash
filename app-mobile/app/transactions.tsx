import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';
import { getTransactions, TransactionResponse } from '@/src/services/accountApi';

export default function TransactionsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { userId } = useAuth();

  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      setTransactions(await getTransactions(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: palette.primary }]}>‹ Voltar</Text>
        </Pressable>
        <Text style={[styles.title, { color: palette.text }]}>Histórico</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={loadTransactions}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: palette.softText }]}>
              Nenhuma transferência encontrada.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: palette.card }]}>
              <View>
                <Text style={[styles.itemTitle, { color: palette.text }]}>
                  Máquina {item.machine_id ?? 'não informada'}
                </Text>
                <Text style={[styles.date, { color: palette.softText }]}>
                  {new Date(item.created_at).toLocaleString('pt-BR')}
                </Text>
              </View>

              <Text style={[styles.amount, { color: palette.primary }]}>
                -{item.amount}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 18 },
  back: { fontSize: 16, fontWeight: '700', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '800' },
  loader: { marginTop: 40 },
  list: { padding: 20, paddingTop: 4 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
  },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 5 },
  amount: { fontSize: 20, fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
});