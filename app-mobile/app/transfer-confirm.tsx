import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';
import {
  createMachineAuthorization,
  getMachineAuthorizationStatus,
  simulateMachineConfirmation,
} from '@/src/services/accountApi';

export default function TransferConfirmScreen() {
  const router = useRouter();
  const { machineId, amount, method } = useLocalSearchParams<{
    machineId: string;
    amount: string;
    method?: 'NFC' | 'QR';
  }>();

  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { userId, balance, refreshWallet } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authorizationPayload, setAuthorizationPayload] = useState('');
  const [authorizationId, setAuthorizationId] = useState('');
  const [authorizationToken, setAuthorizationToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [authorizationStatus, setAuthorizationStatus] = useState<'pending' | 'consumed' | 'expired' | 'cancelled'>('pending');
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');

  const credits = Number(amount);
  const selectedMethod = method === 'NFC' ? 'NFC' : 'QR Code';

  useEffect(() => {
    if (!authorizationId || authorizationStatus !== 'pending') return;
    let active = true;
    const checkStatus = async () => {
      try {
        const result = await getMachineAuthorizationStatus(authorizationId);
        if (!active) return;
        if (result.status === 'consumed') {
          setAuthorizationStatus('consumed');
          await refreshWallet();
        } else if (result.status === 'expired' || result.status === 'cancelled') {
          setAuthorizationStatus(result.status);
        }
      } catch {
        // Uma falha pontual de rede não invalida a autorização; a próxima consulta tenta novamente.
      }
    };
    void checkStatus();
    const interval = setInterval(() => void checkStatus(), 2000);
    return () => { active = false; clearInterval(interval); };
  }, [authorizationId, authorizationStatus, refreshWallet]);

  async function confirmTransfer() {
    if (!userId || !machineId || !Number.isFinite(credits) || credits <= 0) {
      setError('Dados da transferência inválidos.');
      return;
    }

    if (balance === null) {
      setError('Saldo indisponível. Aguarde a sincronização.');
      return;
    }

    if (credits > (balance as number)) {
      setError(`Valor maior que o saldo atual (${balance} créditos).`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createMachineAuthorization(userId, credits, machineId, method === 'NFC' ? 'NFC' : 'QR');

      if (result.status === 'insufficient') {
        setError(`Saldo insuficiente. Saldo atual: ${result.balance} créditos.`);
        return;
      }

      if (result.status !== 'pending') {
        setError('Não foi possível concluir a transferência. Tente novamente.');
        return;
      }
      setAuthorizationPayload(result.machinePayload);
      setAuthorizationId(result.authorizationId);
      setAuthorizationToken(result.authorizationToken);
      setExpiresAt(result.expiresAt);
      setAuthorizationStatus('pending');
      setSuccess(true);
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function simulateConfirmation() {
    if (!__DEV__ || !machineId || !authorizationToken) return;
    setSimulating(true);
    setError('');
    try {
      await simulateMachineConfirmation(machineId, authorizationToken);
      setAuthorizationStatus('consumed');
      await refreshWallet();
    } catch (simulationError) {
      setError(simulationError instanceof Error ? simulationError.message : 'Falha ao simular a máquina.');
    } finally {
      setSimulating(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.content}>
          <Text style={styles.successEmoji}>🧸</Text>
          <Text style={[styles.title, { color: palette.text }]}>Autorização criada!</Text>
          <Text style={[styles.message, { color: palette.softText }]}> 
            {authorizationStatus === 'consumed'
              ? 'Jogada confirmada pela máquina. Saldo e histórico foram atualizados.'
              : authorizationStatus === 'expired'
                ? 'Esta autorização expirou sem débito. Crie uma nova para jogar.'
                : authorizationStatus === 'cancelled'
                  ? 'Esta autorização foi substituída por uma mais recente e não pode mais ser usada.'
                  : `Apresente esta autorização à máquina ${machineId}. O saldo só será debitado após a confirmação.`}
          </Text>
          {authorizationStatus === 'pending' ? (
            <>
              <Text style={[styles.expiry, { color: palette.softText }]}>Válida por dois minutos, até {new Date(expiresAt).toLocaleTimeString('pt-BR')}.</Text>
              <Text selectable style={[styles.payload, { color: palette.text, backgroundColor: palette.card }]}> 
                {authorizationPayload}
              </Text>
            </>
          ) : null}

          {__DEV__ && authorizationStatus === 'pending' ? (
            <Pressable disabled={simulating} onPress={simulateConfirmation} style={[styles.devButton, { borderColor: palette.primary }]}> 
              <Text style={[styles.devButtonText, { color: palette.primary }]}>{simulating ? 'Confirmando...' : 'Simular confirmação do ESP32 (dev)'}</Text>
            </Pressable>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, { backgroundColor: palette.primary }]}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.buttonText}>Voltar para Home</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/transactions')}>
            <Text style={[styles.historyLink, { color: palette.primary }]}>
              Ver histórico
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: palette.primary }]}>‹ Voltar</Text>
        </Pressable>

        <Text style={[styles.title, { color: palette.text }]}>Confirmar transferência</Text>

        <View style={[styles.summary, { backgroundColor: palette.card }]}>
          <Text style={[styles.summaryLabel, { color: palette.softText }]}>Máquina</Text>
          <Text style={[styles.summaryValue, { color: palette.text }]}>{machineId}</Text>

          <Text style={[styles.summaryLabel, { color: palette.softText }]}>Créditos</Text>
          <Text style={[styles.summaryValue, { color: palette.primary }]}>
            {credits} créditos
          </Text>
          <Text style={[styles.summaryLabel, { color: palette.softText }]}>Método</Text>
          <Text style={[styles.summaryValue, { color: palette.text }]}>{selectedMethod}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={loading}
          style={[styles.button, { backgroundColor: palette.primary }]}
          onPress={confirmTransfer}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando autorização...' : 'Criar autorização'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, paddingTop: 64 },
  back: { fontSize: 16, fontWeight: '700', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 24 },
  summary: { borderRadius: 18, padding: 20 },
  summaryLabel: { fontSize: 13, marginBottom: 5 },
  summaryValue: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  error: { color: '#E74C3C', fontWeight: '600', marginTop: 18 },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  successEmoji: { fontSize: 54, textAlign: 'center', marginBottom: 18 },
  message: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  payload: { fontSize: 12, marginTop: 20, padding: 12, borderRadius: 10 },
  expiry: { fontSize: 13, textAlign: 'center', marginTop: 14 },
  devButton: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginTop: 16, alignItems: 'center' },
  devButtonText: { fontSize: 14, fontWeight: '800' },
  historyLink: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 22 },
});
