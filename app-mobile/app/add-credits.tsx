import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { fetchCreditPackages, createPixPaymentOrder, type CreditPackageResponse } from '@/src/services/paymentApi';

export default function AddCreditsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const [packages, setPackages] = useState<CreditPackageResponse[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCreditPackages()
      .then((response) => {
        if (active) {
          setPackages(response.packages ?? []);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err.message ?? 'Erro ao carregar pacotes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.code === selectedCode) || null,
    [packages, selectedCode],
  );

  async function handleCreateOrder() {
    if (!selectedPackage) {
      setError('Selecione um pacote antes de continuar.');
      return;
    }

    setCreatingOrder(true);
    setError(null);

    try {
      const response = await createPixPaymentOrder(selectedPackage.code);
      router.push(`/payment-order/${response.order.id}` as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o pedido.');
    } finally {
      setCreatingOrder(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>Adicionar créditos</Text>
        <Text style={[styles.description, { color: palette.softText }]}>Selecione um pacote seguro para gerar um pedido de Pix.</Text>

        {loading ? (
          <Text style={[styles.feedback, { color: palette.text }]}>Carregando pacotes...</Text>
        ) : error ? (
          <Text style={[styles.error, { color: '#E74C3C' }]}>Erro: {error}</Text>
        ) : packages.length === 0 ? (
          <Text style={[styles.feedback, { color: palette.text }]}>Nenhum pacote disponível no momento.</Text>
        ) : (
          <View style={styles.packagesList}>
            {packages.map((item) => {
              const isSelected = item.code === selectedCode;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => setSelectedCode(item.code)}
                  style={[
                    styles.packageCard,
                    { backgroundColor: isSelected ? palette.primary : palette.card },
                  ]}
                >
                  <Text style={[styles.packageTitle, { color: isSelected ? '#ffffff' : palette.text }]}> 
                    {item.name} {item.code === 'PREMIUM' ? '• Melhor valor' : ''}
                  </Text>
                  <Text style={[styles.packagePrice, { color: isSelected ? '#ffffff' : palette.text }]}>R$ {(item.amount_cents / 100).toFixed(2)}</Text>
                  <Text style={[styles.packageCashback, { color: isSelected ? '#ffffff' : palette.softText }]}>{item.credits} {item.credits === 1 ? 'crédito' : 'créditos'}</Text>
                  <Text style={[styles.packageCashback, { color: isSelected ? '#ffffff' : palette.accent }]}>+{item.teddy_coins} TeddyCoins</Text>
                  <Text style={[styles.packageCashback, { color: isSelected ? '#ffffff' : palette.softText }]}>R$ {(item.amount_cents / item.credits / 100).toFixed(2)} por jogada</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          disabled={!selectedPackage || creatingOrder}
          onPress={handleCreateOrder}
          style={[
            styles.actionButton,
            { backgroundColor: selectedPackage ? palette.primary : palette.softText },
          ]}
        >
          <Text style={[styles.actionText, { color: selectedPackage ? '#000' : palette.text }]}>Gerar pedido Pix</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/home')} style={styles.secondaryButton}>
          <Text style={[styles.secondaryText, { color: palette.primary }]}>Voltar para Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  description: { fontSize: 15, marginBottom: 24, lineHeight: 22 },
  feedback: { fontSize: 16, marginBottom: 24 },
  error: { fontSize: 16, marginBottom: 24, color: '#E74C3C' },
  packagesList: { gap: 12 },
  packageCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  packageTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  packagePrice: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  packageCashback: { fontSize: 14 },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  actionText: { fontSize: 16, fontWeight: '800' },
  secondaryButton: { marginTop: 14, alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});
