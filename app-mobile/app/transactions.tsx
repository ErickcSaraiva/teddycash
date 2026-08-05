import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { getTeddyCoinTransactions, type TeddyCoinTransaction } from '@/src/services/economyApi';

const fallback: Record<TeddyCoinTransaction['type'], string> = {
  CREDIT_PURCHASE_REWARD: 'Bônus de compra', DAILY_CHECKIN: 'Check-in diário', GAME_ENTRY: 'Entrada em minijogo',
  GAME_REWARD: 'Recompensa por vitória', CREDIT_REDEMPTION: 'Resgate de crédito', ADMIN_ADJUSTMENT: 'Ajuste administrativo',
};
export default function TransactionsScreen() {
  const router = useRouter(); const { theme } = useTheme(); const palette = getPalette(theme);
  const [items, setItems] = useState<TeddyCoinTransaction[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setItems((await getTeddyCoinTransactions()).items); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <View style={[styles.container, { backgroundColor: palette.background }]}><View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: palette.primary }}>‹ Voltar</Text></Pressable><Text style={[styles.title, { color: palette.text }]}>TeddyCoins</Text></View>
    {loading ? <ActivityIndicator color={palette.primary} /> : <FlatList data={items} keyExtractor={(item) => item.id} onRefresh={load} refreshing={loading} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={{ color: palette.softText }}>Nenhuma movimentação.</Text>} renderItem={({ item }) => <View style={[styles.item, { backgroundColor: palette.card }]}><View style={styles.details}><Text style={[styles.name, { color: palette.text }]}>{item.description ?? fallback[item.type]}</Text><Text style={{ color: palette.softText }}>{new Date(item.created_at).toLocaleString('pt-BR')} • Saldo {item.balance_after}</Text></View><Text style={[styles.amount, { color: item.amount >= 0 ? palette.accent : '#E57373' }]}>{item.amount > 0 ? '+' : ''}{item.amount}</Text></View>} />}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1 }, header: { padding: 20, paddingTop: 64, gap: 18 }, title: { fontSize: 28, fontWeight: '800' }, list: { padding: 20, paddingTop: 4 }, item: { padding: 17, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }, details: { flex: 1, gap: 5 }, name: { fontWeight: '700' }, amount: { fontSize: 20, fontWeight: '800', marginLeft: 12 } });
