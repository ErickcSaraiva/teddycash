import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { privacyApi, type PrivacyOverview, type PrivacyRequest } from '@/src/services/privacyApi';

export default function PrivacyScreen() {
  const router = useRouter(); const { theme } = useTheme(); const palette = getPalette(theme);
  const [data, setData] = useState<PrivacyOverview | null>(null); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await privacyApi.overview()); } catch { setError('Não foi possível consultar seus dados.'); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const requirePassword = () => { if (password.length < 6) { setError('Digite sua senha atual para confirmar a ação.'); return false; } return true; };
  async function action(name: string, operation: () => Promise<unknown>, success: string) {
    if (!requirePassword() || busy) return; setBusy(name); setError('');
    try { await operation(); setPassword(''); await load(); Alert.alert('Solicitação registrada', success); }
    catch { setError('Não foi possível confirmar a operação. Verifique sua senha e tente novamente.'); }
    finally { setBusy(''); }
  }
  const deletion = data?.requests.find((item) => item.type === 'DELETION' && ['AWAITING_CONFIRMATION', 'PENDING_REVIEW', 'APPROVED', 'PROCESSING'].includes(item.status));
  const avatarConsent = data?.consent_purposes.find((item) => item.purpose === 'PUBLIC_AVATAR_HOSTING');
  async function changeConsent(granted: boolean) {
    await action('consent', () => privacyApi.setConsent('PUBLIC_AVATAR_HOSTING', granted, password), granted ? 'Consentimento específico registrado.' : 'Consentimento revogado. O avatar foi removido da conta; a remoção no provedor será tratada conforme a política operacional.');
  }
  async function exportData() {
    if (!requirePassword() || busy) return; setBusy('export'); setError('');
    try {
      const result = await privacyApi.requestExport(password); setPassword(''); await load();
      await Share.share({ title: 'Exportação de dados TeddyCash', message: JSON.stringify(result.export, null, 2) });
    } catch { setError('Não foi possível gerar ou compartilhar a exportação. Verifique sua senha e tente novamente.'); }
    finally { setBusy(''); }
  }
  return <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={{ color: palette.primary }}>‹ Voltar</Text></Pressable>
    <Text style={[styles.title, { color: palette.text }]}>Privacidade e dados</Text>
    {loading ? <ActivityIndicator color={palette.primary} /> : null}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {data ? <>
      <Card palette={palette}><Text style={[styles.heading, { color: palette.text }]}>Seus dados da conta</Text><Text style={{ color: palette.softText }}>Usuário: {data.account.username}</Text><Text style={{ color: palette.softText }}>E-mail: {data.account.email}</Text><Text style={{ color: palette.softText }}>Conta criada: {new Date(data.account.created_at).toLocaleDateString('pt-BR')}</Text><Text style={{ color: palette.softText }}>Situação: {data.account.privacy_status}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/profile')} style={styles.link}><Text style={{ color: palette.primary }}>Corrigir dados permitidos</Text></Pressable></Card>
      <Card palette={palette}><Text style={[styles.heading, { color: palette.text }]}>Aviso de privacidade</Text><Text style={{ color: palette.softText }}>Versão {data.notice.currentVersion} · vigente desde {data.notice.effectiveDate}</Text>{data.notice.history.map((item) => <Text key={item.version} style={[styles.small, { color: palette.softText }]}>{item.version}: {item.summary}</Text>)}</Card>
      <Card palette={palette}><Text style={[styles.heading, { color: palette.text }]}>Confirmação de identidade</Text><Text style={{ color: palette.softText }}>Digite sua senha somente para a ação sensível que deseja realizar.</Text><TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Senha atual" placeholderTextColor={palette.softText} autoComplete="current-password" style={[styles.input, { color: palette.text, borderColor: palette.border }]} /></Card>
      {avatarConsent ? <Card palette={palette}><View style={styles.row}><View style={styles.flex}><Text style={[styles.heading, { color: palette.text }]}>{avatarConsent.title}</Text><Text style={{ color: palette.softText }}>{avatarConsent.description}</Text></View><Switch accessibilityLabel="Consentimento para hospedagem pública do avatar" value={avatarConsent.granted} disabled={Boolean(busy)} onValueChange={(value) => void changeConsent(value)} /></View><Text style={[styles.small, { color: palette.softText }]}>Opcional e revogável. Desativado por padrão.</Text></Card> : null}
      <Card palette={palette}><Text style={[styles.heading, { color: palette.text }]}>Exportação</Text><Text style={{ color: palette.softText }}>Gera uma cópia JSON dos dados da conta sem senha, tokens ou segredos e abre o compartilhamento seguro do dispositivo.</Text><Button label={busy === 'export' ? 'Gerando…' : 'Solicitar exportação'} disabled={Boolean(busy)} color={palette.primary} onPress={() => void exportData()} /></Card>
      <Card palette={palette}><Text style={[styles.heading, { color: palette.text }]}>Exclusão da conta</Text><Text style={{ color: palette.softText }}>A solicitação não apaga dados imediatamente. Ela exige confirmação e revisão sobre retenções legais.</Text>{deletion ? <RequestStatus request={deletion} color={palette.softText} /> : <Button label={busy === 'delete' ? 'Solicitando…' : 'Solicitar exclusão'} disabled={Boolean(busy)} color="#9B2C2C" onPress={() => void action('delete', () => privacyApi.requestDeletion(password), 'Agora confirme a solicitação antes que ela siga para revisão.')} />}{deletion?.status === 'AWAITING_CONFIRMATION' ? <Button label="Confirmar solicitação" disabled={Boolean(busy)} color="#9B2C2C" onPress={() => void action('confirm', () => privacyApi.confirmDeletion(deletion.id, password), 'Solicitação enviada para revisão. Nenhuma exclusão automática foi executada.')} /> : null}{deletion && ['AWAITING_CONFIRMATION', 'PENDING_REVIEW'].includes(deletion.status) ? <Button label="Cancelar solicitação" disabled={Boolean(busy)} color={palette.primary} onPress={() => void action('cancel', () => privacyApi.cancelDeletion(deletion.id, password), 'Solicitação cancelada.')} /> : null}</Card>
      <Text style={[styles.notice, { color: palette.softText }]}>O TeddyCash não usa dados dos jogos para publicidade comportamental. Questões sobre faixa etária, responsável legal, retenção e hipóteses legais ainda dependem de validação jurídica antes da publicação.</Text>
    </> : null}
  </ScrollView>;
}
function Card({ children, palette }: { children: React.ReactNode; palette: ReturnType<typeof getPalette> }) { return <View style={[styles.card, { backgroundColor: palette.card }]}>{children}</View>; }
function Button({ label, onPress, disabled, color }: { label: string; onPress: () => void; disabled: boolean; color: string }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.55 : 1 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>; }
function RequestStatus({ request, color }: { request: PrivacyRequest; color: string }) { return <Text accessibilityLiveRegion="polite" style={{ color, marginTop: 10 }}>Status: {request.status} · solicitada em {new Date(request.requested_at).toLocaleString('pt-BR')}</Text>; }
const styles = StyleSheet.create({ content: { padding: 20, paddingTop: 60, paddingBottom: 50 }, back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }, title: { fontSize: 28, fontWeight: '800', marginBottom: 20 }, card: { borderRadius: 18, padding: 18, marginBottom: 14 }, heading: { fontSize: 17, fontWeight: '800', marginBottom: 7 }, small: { fontSize: 12, lineHeight: 18, marginTop: 8 }, input: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14 }, row: { flexDirection: 'row', gap: 12, alignItems: 'center' }, flex: { flex: 1 }, button: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 12 }, buttonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' }, link: { minHeight: 44, justifyContent: 'center', marginTop: 8 }, error: { color: '#E57373', marginBottom: 12 }, notice: { fontSize: 12, lineHeight: 18 } });
