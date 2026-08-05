import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';
import { getApiError, redeemCredit } from '@/src/services/economyApi';
type Insufficient = { code: 'INSUFFICIENT_TEDDY_COINS'; required: number; available: number };
export default function RewardsScreen() {
  const { theme } = useTheme(); const palette = getPalette(theme); const { teddyCoins, refreshWallet } = useAuth();
  function confirm() { Alert.alert('Confirmar resgate', 'Trocar 500 TeddyCoins por 1 crédito?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Trocar', onPress: () => void execute() }]); }
  async function execute() { try { const result = await redeemCredit(); await refreshWallet(); Alert.alert('Resgate concluído', `Novo saldo: ${result.balance.credits} créditos e ${result.balance.teddy_coins} TeddyCoins.`); } catch (error) { const body = getApiError<Insufficient>(error); Alert.alert('Resgate não realizado', body?.code === 'INSUFFICIENT_TEDDY_COINS' ? `Você tem ${body.available} de ${body.required} TeddyCoins necessários.` : 'Tente novamente.'); } }
  return <View style={[styles.container, { backgroundColor: palette.background }]}><Text style={[styles.title, { color: palette.text }]}>Resgates</Text><Text style={[styles.balance, { color: palette.accent }]}>Saldo: {teddyCoins ?? '—'} TeddyCoins</Text><View style={[styles.card, { backgroundColor: palette.card }]}><Text style={[styles.amount, { color: palette.text }]}>500 TeddyCoins</Text><Text style={{ color: palette.softText }}>Trocar por 1 crédito</Text><Pressable onPress={confirm} style={[styles.button, { backgroundColor: palette.primary }]}><Text style={styles.buttonText}>Trocar</Text></Pressable></View></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, paddingTop: 64 }, title: { fontSize: 28, fontWeight: '800' }, balance: { marginTop: 8, marginBottom: 24, fontWeight: '700' }, card: { borderRadius: 20, padding: 24 }, amount: { fontSize: 22, fontWeight: '800', marginBottom: 5 }, button: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 }, buttonText: { color: '#fff', fontWeight: '800' } });
