import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { getApiError, startGame } from '@/src/services/economyApi';
import { useAuth } from '@/src/hooks/useAuth';

const games = [{ id: 'coin-collector', name: 'Caça-moedas' }, { id: 'quick-tap', name: 'Toque rápido' }, { id: 'puzzle', name: 'Quebra-cabeça' }];
type Insufficient = { code: 'INSUFFICIENT_TEDDY_COINS'; required: number; available: number };
export default function GamesScreen() {
  const { theme } = useTheme(); const palette = getPalette(theme); const { refreshWallet } = useAuth(); const [starting, setStarting] = useState<string | null>(null);
  async function handleStart(gameId: string) {
    setStarting(gameId);
    try { const result = await startGame(gameId); await refreshWallet(); Alert.alert('Partida iniciada', `Sessão ${result.session.id.slice(0, 8)} criada. A validação de vitória ainda depende do motor seguro do jogo.`); }
    catch (error) { const body = getApiError<Insufficient>(error); Alert.alert(body?.code === 'INSUFFICIENT_TEDDY_COINS' ? 'Saldo insuficiente' : 'Erro', body?.code === 'INSUFFICIENT_TEDDY_COINS' ? `Necessário: ${body.required}. Disponível: ${body.available}.` : 'Não foi possível iniciar.'); }
    finally { setStarting(null); }
  }
  return <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
    <Text style={[styles.title, { color: palette.text }]}>Minijogos</Text><Text style={[styles.rules, { color: palette.softText }]}>Entrada: 5 TeddyCoins{`\n`}Prêmio por vitória validada: 25 TeddyCoins</Text>
    {games.map((game) => <View key={game.id} style={[styles.card, { backgroundColor: palette.card }]}><Text style={[styles.name, { color: palette.text }]}>{game.name}</Text><Pressable onPress={() => handleStart(game.id)} disabled={starting !== null} style={[styles.button, { backgroundColor: palette.primary }]}><Text style={styles.buttonText}>{starting === game.id ? 'Iniciando...' : 'Iniciar por 5 🪙'}</Text></Pressable></View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 20, paddingTop: 64 }, title: { fontSize: 28, fontWeight: '800' }, rules: { lineHeight: 22, marginTop: 8, marginBottom: 20 }, card: { borderRadius: 18, padding: 20, marginBottom: 12 }, name: { fontSize: 18, fontWeight: '800', marginBottom: 14 }, button: { borderRadius: 12, alignItems: 'center', padding: 13 }, buttonText: { color: '#fff', fontWeight: '800' } });
