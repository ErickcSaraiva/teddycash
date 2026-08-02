import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';

export default function TransferScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { balance } = useAuth();

  const [machineId, setMachineId] = useState('');
  const [amount, setAmount] = useState('');

  const credits = Number(amount.replace(',', '.'));
  const validAmount = Number.isFinite(credits) && credits > 0;
  const balanceKnown = balance !== null && balance !== undefined;
  const allowed = balanceKnown ? credits <= (balance as number) : false;

  function goToConfirmation() {
    if (!machineId.trim() || !validAmount || !balanceKnown || !allowed) return;

    router.push({
      pathname: '/transfer-confirm',
      params: {
        machineId: machineId.trim(),
        amount: String(credits),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: palette.primary }]}>‹ Voltar</Text>
        </Pressable>

        <Text style={[styles.title, { color: palette.text }]}>
          Transferir para máquina
        </Text>

        <Text style={[styles.subtitle, { color: palette.softText }]}>
          Informe o código da máquina e os créditos que deseja usar.
        </Text>

        <View style={[styles.balanceCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.balanceLabel, { color: palette.softText }]}>
            Saldo disponível
          </Text>
          <Text style={[styles.balanceValue, { color: palette.primary }]}> 
            {balanceKnown ? `${balance} créditos` : 'Saldo indisponível'}
          </Text>
        </View>

        <Text style={[styles.label, { color: palette.text }]}>Código da máquina</Text>
        <TextInput
          value={machineId}
          onChangeText={setMachineId}
          placeholder="Ex.: MAQUINA-001"
          placeholderTextColor={palette.softText}
          autoCapitalize="characters"
          style={[styles.input, { color: palette.text, backgroundColor: palette.card }]}
        />

        <Text style={[styles.label, { color: palette.text }]}>Quantidade de créditos</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Ex.: 5"
          placeholderTextColor={palette.softText}
          keyboardType="decimal-pad"
          style={[styles.input, { color: palette.text, backgroundColor: palette.card }]}
        />

        <Pressable
          disabled={!machineId.trim() || !validAmount || !balanceKnown || !allowed}
          onPress={goToConfirmation}
          style={[
            styles.button,
            {
              backgroundColor:
                machineId.trim() && validAmount && balanceKnown && allowed ? palette.primary : palette.softText,
            },
          ]}
        >
          <Text style={styles.buttonText}>{!balanceKnown ? 'Saldo indisponível' : !allowed ? 'Valor maior que o saldo' : 'Revisar transferência'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, paddingTop: 64 },
  back: { fontSize: 16, fontWeight: '700', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  balanceCard: { borderRadius: 18, padding: 20, marginBottom: 26 },
  balanceLabel: { fontSize: 14 },
  balanceValue: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});