import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { gamesApi, type GameCatalogItem } from '@/src/services/gamesApi';
import { useAuth } from '@/src/hooks/useAuth';

export default function GamesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { teddyCoins } = useAuth();
  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setGames((await gamesApi.list()).games); }
    catch { setError('Não foi possível carregar os jogos. Verifique sua conexão.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={styles.content}>
    <Text style={[styles.title, { color: palette.text }]}>Minijogos</Text>
    <View style={[styles.wallet, { backgroundColor: palette.card }]}>
      <Text style={{ color: palette.softText }}>Saldo promocional</Text>
      <Text style={[styles.coins, { color: palette.accent }]}>🪙 {teddyCoins ?? '—'} TeddyCoins</Text>
      <Text style={[styles.separation, { color: palette.softText }]}>Créditos de máquina não são usados nos jogos.</Text>
    </View>
    {loading ? <ActivityIndicator accessibilityLabel="Carregando jogos" color={palette.primary} /> : null}
    {error ? <View style={[styles.card, { backgroundColor: palette.card }]}><Text style={{ color: palette.text }}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={[styles.button, { backgroundColor: palette.primary }]}><Text style={styles.buttonText}>Tentar novamente</Text></Pressable></View> : null}
    {games.map((game) => <View key={game.id} style={[styles.card, { backgroundColor: palette.card }]}>
      <Text style={[styles.name, { color: palette.text }]}>🧸 {game.name}</Text>
      <Text style={[styles.description, { color: palette.softText }]}>30 segundos • entrada gratuita</Text>
      <Text style={[styles.reward, { color: palette.accent }]}>Recompensa máxima: {game.maximum_reward} TeddyCoins</Text>
      <Text style={[styles.description, { color: palette.softText }]}>Limite diário: {game.daily_limit} partidas</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver regras de ${game.name}`} onPress={() => router.push('/coin-collector' as Href)} style={[styles.button, { backgroundColor: palette.primary }]}><Text style={styles.buttonText}>Ver regras e jogar</Text></Pressable>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 64, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 18 },
  wallet: { borderRadius: 18, padding: 18, marginBottom: 20 },
  coins: { fontSize: 22, fontWeight: '800', marginTop: 5 },
  separation: { fontSize: 13, marginTop: 7 },
  card: { borderRadius: 18, padding: 20, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '800' },
  description: { marginTop: 7, lineHeight: 20 },
  reward: { marginTop: 12, fontWeight: '800' },
  button: { borderRadius: 12, alignItems: 'center', padding: 15, marginTop: 18, minHeight: 48 },
  buttonText: { color: '#fff', fontWeight: '800' },
});
