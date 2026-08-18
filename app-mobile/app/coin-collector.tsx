import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Alert, Platform, Pressable,
  StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';
import { gamesApi, GameApiError, type CompleteGamePayload, type GameCompleteResponse, type GameSession } from '@/src/services/gamesApi';
import {
  COIN_COLLECTOR_DURATION_MS, createTarget, registerTap, remainingSeconds,
  TARGET_SIZE, type GameEvent, type Target,
} from '@/src/games/coinCollectorLogic';

type Phase = 'RULES' | 'STARTING' | 'PLAYING' | 'SUBMITTING' | 'RESULT' | 'ERROR';
const GAME_ID = 'coin-collector';
const BOARD_HEIGHT = 420;

function errorMessage(error: unknown) {
  if (!(error instanceof GameApiError)) return 'Não foi possível comunicar com o servidor.';
  if (error.code === 'DAILY_LIMIT_REACHED') return 'Você atingiu o limite diário de partidas. Volte amanhã.';
  if (error.code === 'SESSION_EXPIRED') return 'A sessão expirou antes da validação. Inicie uma nova partida.';
  if (error.code === 'INVALID_SESSION_TOKEN' || error.code === 'SESSION_UNAVAILABLE') return 'A sessão não está mais disponível. Inicie uma nova partida.';
  if (error.code === 'COMPLETION_PAYLOAD_CONFLICT') return 'Esta sessão já possui outro resultado aprovado. Nenhuma recompensa foi duplicada.';
  if (error.status === 422) return 'O servidor rejeitou os eventos desta partida. Nenhuma recompensa foi adicionada.';
  if (error.code === 'OFFLINE') return 'Sem conexão. Seu resultado continua nesta tela para uma nova tentativa.';
  if (error.status && error.status >= 500) return 'O servidor não conseguiu validar a partida. Tente novamente.';
  return error.message;
}

export default function CoinCollectorScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { teddyCoins, refreshWallet } = useAuth();
  const boardWidth = Math.max(280, Math.min(620, width - 32));
  const [phase, setPhase] = useState<Phase>('RULES');
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [target, setTarget] = useState<Target>(() => createTarget(Math.random, boardWidth, BOARD_HEIGHT, 1));
  const [session, setSession] = useState<GameSession | null>(null);
  const [result, setResult] = useState<GameCompleteResponse | null>(null);
  const [error, setError] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const eventsRef = useRef<GameEvent[]>([]);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);
  const submittingRef = useRef(false);
  const pendingPayloadRef = useRef<CompleteGamePayload | null>(null);
  const targetIdRef = useRef(1);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const submitResult = useCallback(async (payload: CompleteGamePayload) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    pendingPayloadRef.current = payload;
    setPhase('SUBMITTING'); setError('');
    try {
      const approved = await gamesApi.complete(GAME_ID, payload);
      setResult(approved);
      pendingPayloadRef.current = null;
      await refreshWallet().catch(() => null);
      setPhase('RESULT');
    } catch (requestError) {
      if (requestError instanceof GameApiError && !['OFFLINE', 'RATE_LIMITED', 'SERVER_ERROR'].includes(requestError.code) && (!requestError.status || requestError.status < 500)) {
        pendingPayloadRef.current = null;
      }
      setError(errorMessage(requestError));
      setPhase('ERROR');
    } finally {
      submittingRef.current = false;
    }
  }, [refreshWallet]);

  const finish = useCallback(() => {
    if (!session || submittingRef.current || pendingPayloadRef.current) return;
    const durationMs = Math.max(COIN_COLLECTOR_DURATION_MS, Math.floor(Date.now() - startedAtRef.current));
    void submitResult({
      session_id: session.id,
      session_token: session.token,
      duration_ms: durationMs,
      score: scoreRef.current,
      events: eventsRef.current,
    });
  }, [session, submitResult]);

  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const timer = setInterval(() => {
      const remaining = remainingSeconds(startedAtRef.current, Date.now());
      setSeconds(remaining);
      if (remaining === 0) finish();
    }, 200);
    return () => clearInterval(timer);
  }, [finish, phase]);

  async function start() {
    if (phase === 'STARTING') return;
    setPhase('STARTING'); setError(''); setResult(null);
    try {
      const response = await gamesApi.start(GAME_ID);
      eventsRef.current = []; scoreRef.current = 0; targetIdRef.current = 1;
      setScore(0); setSeconds(30); setSession(response.session);
      startedAtRef.current = Date.now();
      setTarget(createTarget(Math.random, boardWidth, BOARD_HEIGHT, targetIdRef.current));
      setPhase('PLAYING');
    } catch (requestError) {
      setError(errorMessage(requestError));
      setPhase('RULES');
    }
  }

  function tapTarget() {
    if (phase !== 'PLAYING') return;
    const elapsed = Date.now() - startedAtRef.current;
    const next = registerTap(scoreRef.current, eventsRef.current, target, elapsed);
    if (!next.accepted) return;
    scoreRef.current = next.score; eventsRef.current = next.events;
    setScore(next.score);
    targetIdRef.current += 1;
    setTarget(createTarget(Math.random, boardWidth, BOARD_HEIGHT, targetIdRef.current));
  }

  function leave() {
    if (phase === 'PLAYING') {
      Alert.alert('Sair da partida?', 'Esta sessão será abandonada e contará no limite diário.', [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  }

  if (phase === 'RULES' || phase === 'STARTING') return <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}><View style={styles.page}>
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar para a lista de jogos" onPress={leave} style={styles.back}><Text style={{ color: palette.primary }}>‹ Voltar</Text></Pressable>
    <Text style={[styles.title, { color: palette.text }]}>🧸 Caça às TeddyCoins</Text>
    <View style={[styles.rulesCard, { backgroundColor: palette.card }]}>
      <Text style={[styles.ruleTitle, { color: palette.text }]}>Como jogar</Text>
      <Text style={[styles.rule, { color: palette.softText }]}>• Você tem 30 segundos.</Text>
      <Text style={[styles.rule, { color: palette.softText }]}>• Toque em 🪙 ou 🧸 para ganhar 1 ponto.</Text>
      <Text style={[styles.rule, { color: palette.softText }]}>• 🐝 e ☁️ retiram 1 ponto, sem deixar o placar negativo.</Text>
      <Text style={[styles.rule, { color: palette.softText }]}>• Entrada gratuita; créditos de máquina não são usados.</Text>
      <Text style={[styles.maximum, { color: palette.accent }]}>Recompensa máxima: 50 TeddyCoins</Text>
      <Text style={[styles.balance, { color: palette.softText }]}>Seu saldo: {teddyCoins ?? 'carregando…'} TeddyCoins</Text>
      {reduceMotion ? <Text style={[styles.motion, { color: palette.softText }]}>Movimento reduzido está ativo.</Text> : null}
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Iniciar Caça às TeddyCoins" disabled={phase === 'STARTING'} onPress={() => void start()} style={[styles.primary, { backgroundColor: palette.primary }]}>{phase === 'STARTING' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Começar gratuitamente</Text>}</Pressable>
  </View></SafeAreaView>;

  if (phase === 'RESULT' && result) return <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}><View style={styles.resultPage}>
    <Text style={styles.resultEmoji}>🎉</Text>
    <Text style={[styles.title, { color: palette.text }]}>Resultado aprovado</Text>
    <Text style={[styles.resultScore, { color: palette.text }]}>{result.session.score} pontos</Text>
    <Text style={[styles.resultReward, { color: palette.accent }]}>+{result.reward} TeddyCoins</Text>
    <Text style={[styles.approved, { color: palette.softText }]}>{result.idempotent ? 'Resultado já validado anteriormente; nenhuma recompensa foi duplicada.' : 'Recompensa calculada e aprovada pelo servidor.'}</Text>
    <Text style={[styles.balance, { color: palette.softText }]}>Saldo confirmado: {result.teddy_coins} TeddyCoins</Text>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/games')} style={[styles.primary, { backgroundColor: palette.primary }]}><Text style={styles.primaryText}>Voltar aos jogos</Text></Pressable>
  </View></SafeAreaView>;

  if (phase === 'ERROR') return <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}><View style={styles.resultPage}>
    <Text style={styles.resultEmoji}>🛡️</Text><Text style={[styles.title, { color: palette.text }]}>Resultado não confirmado</Text>
    <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>
    {pendingPayloadRef.current ? <Pressable accessibilityRole="button" disabled={submittingRef.current} onPress={() => void submitResult(pendingPayloadRef.current!)} style={[styles.primary, { backgroundColor: palette.primary }]}><Text style={styles.primaryText}>Reenviar o mesmo resultado</Text></Pressable> : null}
    <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/games')} style={styles.secondary}><Text style={{ color: palette.primary, fontWeight: '800' }}>Voltar aos jogos</Text></Pressable>
  </View></SafeAreaView>;

  return <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
    <View style={styles.gameHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Sair da partida" onPress={leave} style={styles.exit}><Text style={{ color: palette.primary, fontWeight: '800' }}>Sair</Text></Pressable>
      <View><Text style={[styles.hudLabel, { color: palette.softText }]}>TEMPO</Text><Text accessibilityLiveRegion="polite" style={[styles.hudValue, { color: seconds <= 5 ? '#E57373' : palette.text }]}>{seconds}s</Text></View>
      <View><Text style={[styles.hudLabel, { color: palette.softText }]}>PONTOS</Text><Text accessibilityLiveRegion="polite" style={[styles.hudValue, { color: palette.accent }]}>{score}</Text></View>
    </View>
    <View style={[styles.board, { width: boardWidth, height: BOARD_HEIGHT, backgroundColor: palette.card, borderColor: palette.border }]} accessibilityLabel="Área do jogo">
      {phase === 'PLAYING' ? <Pressable
        key={target.id}
        accessibilityRole="button"
        accessibilityLabel={target.kind === 'REWARD' ? 'Alvo TeddyCash, vale um ponto' : 'Obstáculo, perde um ponto'}
        onPress={tapTarget}
        style={[styles.target, { left: target.x, top: target.y, opacity: reduceMotion ? 1 : 0.98 }]}
      ><Text style={styles.targetEmoji}>{target.emoji}</Text></Pressable> : <View style={styles.submitting}><ActivityIndicator color={palette.primary} size="large" /><Text style={{ color: palette.text, marginTop: 14 }}>Validando com o servidor…</Text></View>}
    </View>
    <Text style={[styles.hint, { color: palette.softText }]}>{Platform.OS === 'web' ? 'Clique nos alvos do TeddyCash.' : 'Toque nos alvos do TeddyCash.'}</Text>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, page: { flex: 1, padding: 20, paddingTop: 40 }, back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 22 }, rulesCard: { padding: 22, borderRadius: 20 },
  ruleTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 }, rule: { fontSize: 15, lineHeight: 24 }, maximum: { fontSize: 17, fontWeight: '800', marginTop: 18 },
  balance: { marginTop: 12, textAlign: 'center' }, motion: { fontSize: 12, marginTop: 10, textAlign: 'center' },
  primary: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 22 }, primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, error: { color: '#E57373', textAlign: 'center', lineHeight: 22, marginTop: 18 },
  gameHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, exit: { minWidth: 64, minHeight: 48, justifyContent: 'center' },
  hudLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' }, hudValue: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  board: { alignSelf: 'center', borderRadius: 22, borderWidth: 1, overflow: 'hidden', position: 'relative' }, target: { position: 'absolute', width: TARGET_SIZE, height: TARGET_SIZE, borderRadius: TARGET_SIZE / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' }, targetEmoji: { fontSize: 42 },
  submitting: { flex: 1, alignItems: 'center', justifyContent: 'center' }, hint: { textAlign: 'center', marginTop: 14 },
  resultPage: { flex: 1, padding: 24, justifyContent: 'center' }, resultEmoji: { fontSize: 58, textAlign: 'center', marginBottom: 16 }, resultScore: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  resultReward: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginTop: 12 }, approved: { textAlign: 'center', lineHeight: 22, marginTop: 14 },
});
