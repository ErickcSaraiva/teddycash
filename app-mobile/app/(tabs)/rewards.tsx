import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';
export default function RewardsScreen() {
  const { theme } = useTheme(); const palette = getPalette(theme); const { teddyCoins } = useAuth();
  return <View style={[styles.container, { backgroundColor: palette.background }]}><Text style={[styles.title, { color: palette.text }]}>Recompensas</Text><Text style={[styles.balance, { color: palette.accent }]}>Saldo: {teddyCoins ?? '—'} TeddyCoins</Text><View style={[styles.card, { backgroundColor: palette.card }]}><Text style={[styles.amount, { color: palette.text }]}>Economia promocional</Text><Text style={{ color: palette.softText, lineHeight: 21 }}>TeddyCoins são usadas somente em recompensas promocionais. Elas não podem virar créditos nem ser transferidas para máquinas.</Text></View></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, paddingTop: 64 }, title: { fontSize: 28, fontWeight: '800' }, balance: { marginTop: 8, marginBottom: 24, fontWeight: '700' }, card: { borderRadius: 20, padding: 24 }, amount: { fontSize: 22, fontWeight: '800', marginBottom: 8 } });
