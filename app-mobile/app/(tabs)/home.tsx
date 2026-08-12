import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';
import { claimDailyCheckin, getDailyCheckinStatus, type CheckinState } from '@/src/services/economyApi';
import { formatNextCheckin } from '@/src/services/checkinApiCore';
import { SeasonalCampaignBanner } from '@/src/componentes/dashboard/SeasonalCampaignBanner';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, campaign, reduceMotion, isCampaignPreview } = useTheme();
  const palette = getPalette(theme);
  const { username, balance, teddyCoins, refreshWallet, refreshing } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [checkinState, setCheckinState] = useState<CheckinState | null>(null);
  const [checkinError, setCheckinError] = useState('');

  const loadCheckin = useCallback(async () => {
    setStatusLoading(true); setCheckinError('');
    try { setCheckinState(await getDailyCheckinStatus()); }
    catch { setCheckinError('Estado do check-in indisponível. Verifique sua conexão.'); }
    finally { setStatusLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    void refreshWallet().catch(() => {});
    void loadCheckin();
  }, [loadCheckin, refreshWallet]));

  async function checkin() {
    if (checkingIn || checkinState?.claimed) return;
    setCheckingIn(true); setCheckinError('');
    try {
      const result = await claimDailyCheckin();
      setCheckinState(result);
      await refreshWallet().catch(() => null);
      Alert.alert(result.idempotent ? 'Check-in já coletado' : 'Check-in realizado', result.idempotent ? 'A recompensa de hoje já estava no seu saldo.' : `Você recebeu ${result.reward} TeddyCoins.`);
    } catch {
      setCheckinError('Não foi possível realizar o check-in. Verifique sua conexão e tente novamente.');
    } finally { setCheckingIn(false); }
  }

  return <ScrollView style={[styles.container, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
    <Text style={[styles.brand, { color: palette.primary }]}>🧸 TeddyCash</Text>
    <Text style={[styles.title, { color: palette.text }]}>Olá, {username ?? 'Usuário'} 👋</Text>
    <SeasonalCampaignBanner
      campaign={campaign}
      reduceMotion={reduceMotion}
      isPreview={isCampaignPreview}
      onCallToAction={campaign.callToAction ? () => router.push(campaign.callToAction!.route) : undefined}
    />
    <View style={[styles.wallet, { backgroundColor: palette.card }]}>
      <View><Text style={[styles.label, { color: palette.softText }]}>Créditos</Text><Text style={[styles.value, { color: palette.primary }]}>{balance ?? '—'}</Text></View>
      <View><Text style={[styles.label, { color: palette.softText }]}>TeddyCoins</Text><Text style={[styles.value, { color: palette.accent }]}>🪙 {teddyCoins ?? '—'}</Text></View>
    </View>
    <Pressable accessibilityRole="button" onPress={() => void refreshWallet()} disabled={refreshing} style={styles.link}><Text style={{ color: palette.primary }}>{refreshing ? 'Atualizando...' : 'Atualizar carteira'}</Text></Pressable>

    <View style={[styles.checkin, { backgroundColor: palette.card }]}>
      <Text style={[styles.cardTitle, { color: palette.text }]}>Check-in diário</Text>
      <Text style={{ color: palette.softText }}>{checkinState ? `Receba +${checkinState.reward} TeddyCoins uma vez por dia.` : 'Recompensa diária definida pelo servidor.'}</Text>
      {statusLoading ? <View style={styles.statusRow}><ActivityIndicator color={palette.primary} /><Text style={{ color: palette.softText }}> Consultando o servidor…</Text></View> : null}
      {checkinState?.claimed ? <Text accessibilityLiveRegion="polite" style={[styles.claimed, { color: palette.accent }]}>✓ Recompensa de hoje coletada</Text> : null}
      {checkinState ? <Text style={[styles.next, { color: palette.softText }]}>Próxima disponibilidade: {formatNextCheckin(checkinState)} ({checkinState.time_zone})</Text> : null}
      {checkinError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{checkinError}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Coletar check-in diário" onPress={() => void checkin()} disabled={checkingIn || statusLoading || checkinState?.claimed === true} style={[styles.button, { backgroundColor: palette.primary, opacity: checkingIn || statusLoading || checkinState?.claimed ? 0.55 : 1 }]}>
        <Text style={styles.buttonText}>{checkingIn ? 'Confirmando…' : checkinState?.claimed ? 'Já coletado hoje' : checkinState ? `Coletar +${checkinState.reward} TeddyCoins` : 'Aguardando o servidor'}</Text>
      </Pressable>
      {checkinError ? <Pressable accessibilityRole="button" onPress={() => void loadCheckin()} style={styles.retry}><Text style={{ color: palette.primary, fontWeight: '700' }}>Tentar consultar novamente</Text></Pressable> : null}
    </View>

    <Text style={[styles.section, { color: palette.text }]}>Acesso rápido</Text>
    <View style={styles.grid}>
      <Action label="🎮 Minijogos" onPress={() => router.push('/games')} color={palette.card} text={palette.text} />
      <Action label="🎁 Resgatar" onPress={() => router.push('/rewards')} color={palette.card} text={palette.text} />
      <Action label="💳 Comprar" onPress={() => router.push('/add-credits')} color={palette.card} text={palette.text} />
      <Action label="📜 Histórico" onPress={() => router.push('/transactions')} color={palette.card} text={palette.text} />
    </View>
    <Text style={[styles.transferSection, { color: palette.text }]}>Transferência para Máquina</Text>
    <Pressable onPress={() => router.push('/transfer')} style={[styles.transferCard, { backgroundColor: palette.card }]} accessibilityRole="button" accessibilityLabel="Transferir créditos para a máquina usando NFC ou QR Code">
      <Text style={styles.transferIcon}>📲</Text><View style={styles.transferContent}><Text style={[styles.transferTitle, { color: palette.text }]}>Transferir créditos</Text><Text style={[styles.transferDescription, { color: palette.softText }]}>Envie seus créditos diretamente para a máquina utilizando NFC ou QR Code.</Text></View><Text style={[styles.transferArrow, { color: palette.softText }]}>›</Text>
    </Pressable>
  </ScrollView>;
}

function Action({ label, onPress, color, text }: { label: string; onPress: () => void; color: string; text: string }) { return <Pressable onPress={onPress} style={[styles.action, { backgroundColor: color }]}><Text style={{ color: text, fontWeight: '700' }}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20, paddingTop: 64, paddingBottom: 40 }, brand: { fontWeight: '800', marginBottom: 6 }, title: { fontSize: 28, fontWeight: '800', marginBottom: 24 },
  wallet: { borderRadius: 20, padding: 22, flexDirection: 'row', justifyContent: 'space-between' }, label: { fontSize: 13, marginBottom: 6 }, value: { fontSize: 28, fontWeight: '800' }, link: { alignSelf: 'center', padding: 12, minHeight: 44 },
  checkin: { borderRadius: 20, padding: 20, marginTop: 8 }, cardTitle: { fontSize: 19, fontWeight: '800', marginBottom: 5 }, statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 }, claimed: { fontWeight: '800', marginTop: 14 }, next: { marginTop: 8, fontSize: 12 }, error: { color: '#E57373', marginTop: 12, lineHeight: 19 },
  button: { minHeight: 48, padding: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, buttonText: { color: '#fff', fontWeight: '800' }, retry: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  section: { fontSize: 18, fontWeight: '800', marginTop: 28, marginBottom: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, action: { flexBasis: '48%', flexGrow: 1, borderRadius: 15, padding: 18 },
  transferSection: { fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 12 }, transferCard: { width: '100%', flexDirection: 'row', alignItems: 'center', borderRadius: 15, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  transferIcon: { fontSize: 26, marginRight: 14 }, transferContent: { flex: 1, paddingRight: 12 }, transferTitle: { fontSize: 16, fontWeight: '700', marginBottom: 5 }, transferDescription: { fontSize: 13, lineHeight: 19 }, transferArrow: { fontSize: 28, fontWeight: '300' },
});
