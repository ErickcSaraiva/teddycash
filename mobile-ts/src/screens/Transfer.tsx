import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
const MACHINES = ['Garra Teddy #42', 'Garra Teddy #17', 'Puzzle Teddy #03'];
const AMOUNTS = [50, 100, 200];

export default function TransferScreen({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [selectedMachine, setSelectedMachine] = useState<string>(MACHINES[0]);
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [sending, setSending] = useState<boolean>(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
    ).start();
  }, [pulseAnim]);

  const circleStyle = (index: number) => {
    const inputRange = [0, 1];
    const size = pulseAnim.interpolate({ inputRange, outputRange: [60 + index * 20, 140 + index * 20] });
    const opacity = pulseAnim.interpolate({ inputRange, outputRange: [0.16 - index * 0.04, 0] });
    return {
      width: size,
      height: size,
      borderRadius: Animated.divide(size, 2),
      backgroundColor: '#3D5AFE',
      opacity,
      position: 'absolute' as const,
    };
  };

  async function handleSend() {
    setSending(false);
    Alert.alert('Fluxo legado desativado', 'Use o aplicativo ativo em app-mobile para transferir com uma sessão autenticada.');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Transferir Moedas</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card} accessibilityLabel="Painel de transferência NFC e seleção de máquina">
          <Text style={styles.cardTitle}>Seu baú: (◯) 1.250</Text>
          <Text style={styles.cardSubtitle}>Mandar Moedas para a Máquina</Text>
          <View style={styles.nfcContainer}>
            <View style={styles.nfcCenter}>
              {[0, 1, 2].map((index) => (
                <Animated.View key={index} style={[styles.pulse, circleStyle(index)]} />
              ))}
              <View style={styles.nfcIconWrapper}>
                <Text style={styles.nfcIcon}>📶</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Escolha a máquina</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.machineList}>
          {MACHINES.map((machine) => {
            const selected = machine === selectedMachine;
            return (
              <Pressable
                key={machine}
                onPress={() => setSelectedMachine(machine)}
                style={[styles.machineCard, selected && styles.machineCardSelected]}
              >
                <View style={styles.machineIcon} />
                <Text style={[styles.machineLabel, selected && styles.machineLabelSelected]}>{machine}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Quantas moedas vamos enviar?</Text>
        <View style={styles.amountRow}>
          {AMOUNTS.map((amount) => {
            const selected = amount === selectedAmount;
            return (
              <Pressable
                key={amount}
                onPress={() => setSelectedAmount(amount)}
                style={[styles.amountChoice, selected && styles.amountChoiceSelected]}
              >
                <Text style={[styles.amountChoiceText, selected && styles.amountChoiceTextSelected]}>💰</Text>
                <Text style={[styles.amountChoiceValue, selected && styles.amountChoiceValueSelected]}>{amount}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.buttonRow}>
          <Pressable onPress={onCancel} style={[styles.button, styles.buttonSecondary]} disabled={sending}>
            <Text style={styles.buttonSecondaryText}>VOLTAR</Text>
          </Pressable>
          <Pressable onPress={handleSend} style={[styles.button, styles.buttonPrimary]} disabled={sending}>
            {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonPrimaryText}>ATIVAR TRANSFERÊNCIA</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAEFFF' },
  appBar: { backgroundColor: '#EAEFFF', paddingVertical: 18, paddingHorizontal: 16, borderBottomColor: '#D1D5DB', borderBottomWidth: 1 },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  container: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
  cardSubtitle: { color: '#6B7280', marginBottom: 14 },
  nfcContainer: { alignItems: 'center', justifyContent: 'center' },
  nfcCenter: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute' },
  nfcIconWrapper: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  nfcIcon: { fontSize: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#111827' },
  machineList: { marginBottom: 18 },
  machineCard: { width: 180, marginRight: 12, borderRadius: 18, padding: 12, backgroundColor: '#3D5AFE', flexDirection: 'row', alignItems: 'center' },
  machineCardSelected: { backgroundColor: '#fff' },
  machineIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 12 },
  machineLabel: { flex: 1, color: '#fff', fontWeight: '700' },
  machineLabelSelected: { color: '#1F2937' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountChoice: { width: 92, height: 92, borderRadius: 18, backgroundColor: '#3D5AFE', alignItems: 'center', justifyContent: 'center' },
  amountChoiceSelected: { backgroundColor: '#1D4ED8' },
  amountChoiceText: { fontSize: 28, marginBottom: 6 },
  amountChoiceTextSelected: { color: '#fff' },
  amountChoiceValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  amountChoiceValueSelected: { color: '#fff' },
  buttonRow: { flexDirection: 'row', marginTop: 24, gap: 12 },
  button: { flex: 1, borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: '#FCD34D' },
  buttonPrimaryText: { color: '#000', fontWeight: '700' },
  buttonSecondary: { backgroundColor: '#64748B' },
  buttonSecondaryText: { color: '#fff', fontWeight: '700' },
});
