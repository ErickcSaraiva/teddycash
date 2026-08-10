import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
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
  const [method, setMethod] = useState<'QR' | 'NFC'>('QR');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const nfcAvailable = Platform.OS !== 'web';

  const credits = Number(amount.replace(',', '.'));
  const validAmount = Number.isInteger(credits) && credits > 0 && credits <= 10;
  const balanceKnown = balance !== null && balance !== undefined;
  const allowed = balanceKnown ? credits <= (balance as number) : false;

  function goToConfirmation() {
    if (!machineId.trim() || !validAmount || !balanceKnown || !allowed) return;

    router.push({
      pathname: '/transfer-confirm',
      params: {
        machineId: machineId.trim(),
        amount: String(credits),
        method,
      },
    });
  }

  async function openScanner() {
    setScanError('');
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) {
      setScanError('Permissão da câmera necessária para ler o QR Code.');
      return;
    }
    setScannerOpen(true);
  }

  function handleBarcodeScanned({ data }: BarcodeScanningResult) {
    try {
      const parsed = JSON.parse(data) as { machine_id?: unknown; machineId?: unknown; id?: unknown };
      const value = parsed.machine_id ?? parsed.machineId ?? parsed.id;
      if (typeof value !== 'string' || !value.trim()) throw new Error('invalid');
      setMachineId(value.trim());
    } catch {
      if (!data.trim() || data.length > 100) {
        setScanError('Este QR Code não identifica uma máquina válida.');
        setScannerOpen(false);
        return;
      }
      setMachineId(data.trim());
    }
    setScannerOpen(false);
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
        {method === 'QR' ? (
          <Pressable onPress={openScanner} style={[styles.scanButton, { borderColor: palette.primary }]}> 
            <Text style={[styles.scanButtonText, { color: palette.primary }]}>Ler QR Code da máquina</Text>
          </Pressable>
        ) : null}
        {scanError ? <Text style={styles.error}>{scanError}</Text> : null}

        <Text style={[styles.label, { color: palette.text }]}>Quantidade de créditos</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Ex.: 5"
          placeholderTextColor={palette.softText}
          keyboardType="number-pad"
          style={[styles.input, { color: palette.text, backgroundColor: palette.card }]}
        />

        <Text style={[styles.label, { color: palette.text }]}>Método de transferência</Text>
        <View style={styles.methodRow}>
          <Pressable
            onPress={() => setMethod('QR')}
            style={[
              styles.methodButton,
              {
                backgroundColor: method === 'QR' ? palette.primary : palette.card,
                marginRight: 10,
              },
            ]}
          >
            <Text style={[styles.methodText, { color: method === 'QR' ? '#fff' : palette.text }]}>QR Code</Text>
          </Pressable>
          <Pressable
            onPress={() => nfcAvailable && setMethod('NFC')}
            disabled={!nfcAvailable}
            style={[
              styles.methodButton,
              {
                backgroundColor: method === 'NFC' ? palette.primary : palette.card,
                opacity: nfcAvailable ? 1 : 0.55,
              },
            ]}
          >
            <Text style={[styles.methodText, { color: method === 'NFC' ? '#fff' : palette.text }]}>NFC</Text>
          </Pressable>
        </View>
        {!nfcAvailable ? <Text style={[styles.nfcNotice, { color: palette.softText }]}>NFC está disponível somente no aplicativo em um dispositivo compatível. Use QR Code nesta versão web.</Text> : null}

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
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            active={scannerOpen}
            facing="back"
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scannerOpen ? handleBarcodeScanned : undefined}
          />
          <View style={styles.scanOverlay}>
            <Text style={styles.scanTitle}>Aponte para o QR Code da máquina</Text>
            <View style={styles.scanFrame} />
            <Pressable onPress={() => setScannerOpen(false)} style={styles.closeScanner}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
  },
  scanButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 20 },
  scanButtonText: { fontSize: 15, fontWeight: '700' },
  error: { color: '#E74C3C', fontWeight: '600', marginBottom: 16 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scanOverlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 72 },
  scanTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', paddingHorizontal: 24 },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderColor: '#fff', borderRadius: 20 },
  closeScanner: { backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 15 },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 10,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  nfcNotice: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
});
