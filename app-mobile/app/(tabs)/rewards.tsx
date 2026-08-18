import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';
import { getRewardCatalog, redeemCreditReward } from '@/src/services/economyApi';
import { canRedeemCredit, missingTeddyCoins, type CreditRedemptionReward } from '@/src/services/rewardRedemptionApiCore';
import { ApiError } from '@/src/services/api';

export default function RewardsScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { teddyCoins, refreshWallet } = useAuth();
  const [reward, setReward] = useState<CreditRedemptionReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const requestKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void getRewardCatalog()
      .then((catalog) => { if (active) setReward(catalog.rewards.find((item) => item.id === 'credit-redemption') ?? null); })
      .catch(() => { if (active) setError('Não foi possível carregar as recompensas agora.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const missingCoins = useMemo(() => reward ? missingTeddyCoins(teddyCoins, reward.teddy_coin_cost) : null, [reward, teddyCoins]);
  const canRedeem = canRedeemCredit(teddyCoins, reward, redeeming);

  async function redeem() {
    if (!canRedeem || !reward) return;
    setRedeeming(true); setError(''); setMessage('');
    requestKey.current ??= Crypto.randomUUID();
    try {
      const result = await redeemCreditReward(requestKey.current);
      await refreshWallet();
      setMessage(`🎉 Resgate concluído! ${result.teddy_coins_spent} TeddyCoins foram trocadas por ${result.credits_received} crédito.`);
      requestKey.current = null;
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'INSUFFICIENT_TEDDY_COINS') {
        setError('Você ainda não possui TeddyCoins suficientes para este resgate.');
        requestKey.current = null;
      } else {
        setError(reason instanceof Error ? reason.message : 'Não foi possível concluir o resgate.');
      }
    } finally { setRedeeming(false); }
  }

  return <ScrollView style={[styles.container, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
    <Text style={[styles.title, { color: palette.text }]}>Recompensas</Text>
    <Text style={[styles.balance, { color: palette.accent }]}>Saldo: {teddyCoins ?? '—'} TeddyCoins</Text>

    <View style={[styles.card, { backgroundColor: palette.card }]}>
      <Text style={[styles.heading, { color: palette.text }]}>Economia promocional</Text>
      <Text style={[styles.description, { color: palette.softText }]}>TeddyCoins são moedas promocionais do TeddyCash e não possuem valor monetário. Elas podem ser usadas para resgatar recompensas e, conforme as regras do programa, convertidas em créditos de jogada. TeddyCoins não podem ser sacadas nem transferidas diretamente para máquinas.</Text>
    </View>

    <View style={[styles.card, { backgroundColor: palette.card }]}>
      <Text style={[styles.rewardTitle, { color: palette.text }]}>🎮 {reward ? `${reward.credit_reward} Crédito de Jogada` : 'Crédito de Jogada'}</Text>
      {loading ? <ActivityIndicator color={palette.primary} style={styles.loader} /> : reward ? <>
        <Text style={[styles.price, { color: palette.accent }]}>🪙 {reward.teddy_coin_cost} TeddyCoins</Text>
        <Text style={[styles.description, { color: palette.softText }]}>Troque {reward.teddy_coin_cost} TeddyCoins acumuladas por {reward.credit_reward} crédito para jogar nas máquinas.</Text>
        {missingCoins && missingCoins > 0 ? <Text style={[styles.missing, { color: palette.softText }]}>Faltam {missingCoins} TeddyCoins para resgatar.</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Resgatar crédito de jogada" disabled={!canRedeem} onPress={() => void redeem()} style={[styles.button, { backgroundColor: palette.primary }, !canRedeem && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{redeeming ? 'Resgatando…' : 'Resgatar'}</Text>
        </Pressable>
      </> : <Text style={[styles.description, { color: palette.softText }]}>Recompensa indisponível.</Text>}
    </View>
    {message ? <Text accessibilityLiveRegion="polite" style={styles.success}>{message}</Text> : null}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20, paddingTop: 64, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800' }, balance: { marginTop: 8, marginBottom: 24, fontWeight: '700' },
  card: { borderRadius: 20, padding: 24, marginBottom: 16 }, heading: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  rewardTitle: { fontSize: 21, fontWeight: '800' }, price: { fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 10 },
  description: { lineHeight: 21 }, missing: { marginTop: 14, fontWeight: '700' }, loader: { marginTop: 18 },
  button: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonDisabled: { opacity: 0.45 }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  success: { color: '#1B8A4B', fontWeight: '700', lineHeight: 21 }, error: { color: '#C0392B', fontWeight: '700', lineHeight: 21 },
});
