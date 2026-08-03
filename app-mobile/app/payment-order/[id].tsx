import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { fetchPaymentOrder, type PaymentOrderResponse } from '@/src/services/paymentApi';

export default function PaymentOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = params.id;
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const [order, setOrder] = useState<PaymentOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('ID do pedido inválido.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    fetchPaymentOrder(orderId)
      .then((response) => {
        if (active) {
          setOrder(response);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err.message ?? 'Erro ao buscar pedido.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  async function refresh() {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPaymentOrder(orderId);
      setOrder(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar.');
    } finally {
      setLoading(false);
    }
  }

  const expiresAtLabel = order?.expires_at
    ? new Date(order.expires_at).toLocaleString()
    : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: palette.primary }]}>‹ Voltar</Text>
        </Pressable>

        <Text style={[styles.title, { color: palette.text }]}>Pedido de pagamento</Text>

        {loading ? (
          <Text style={[styles.feedback, { color: palette.text }]}>Carregando pedido...</Text>
        ) : error ? (
          <Text style={[styles.error, { color: '#E74C3C' }]}>Erro: {error}</Text>
        ) : order ? (
          <>
            <View style={[styles.card, { backgroundColor: palette.card }]}> 
              <Text style={[styles.label, { color: palette.softText }]}>Pedido</Text>
            <Text style={[styles.value, { color: palette.text }]}>{order.id.slice(0, 8).toUpperCase()}</Text>

            <Text style={[styles.label, { color: palette.softText }]}>Pacote</Text>
            <Text style={[styles.value, { color: palette.text }]}>{order.package_code}</Text>

            <Text style={[styles.label, { color: palette.softText }]}>Valor</Text>
            <Text style={[styles.value, { color: palette.primary }]}>R$ {(order.amount_cents / 100).toFixed(2)}</Text>

            <Text style={[styles.label, { color: palette.softText }]}>Créditos</Text>
            <Text style={[styles.value, { color: palette.text }]}>{order.credits} créditos</Text>

            <Text style={[styles.label, { color: palette.softText }]}>Bônus de fidelidade</Text>
            <Text style={[styles.value, { color: palette.text }]}>+{order.teddy_coins} TeddyCoins</Text>

            <Text style={[styles.label, { color: palette.softText }]}>Status</Text>
            <Text style={[styles.value, { color: palette.accent }]}>{order.status === 'PENDING' ? 'Aguardando pagamento' : order.status}</Text>

            <Text style={[styles.label, { color: palette.softText }]}>Expira em</Text>
            <Text style={[styles.value, { color: palette.text }]}>{expiresAtLabel}</Text>

              <Text style={[styles.notice, { color: palette.softText }]}>O Pix ainda será disponibilizado quando a integração com o provedor estiver configurada.</Text>
            </View>

            <Pressable onPress={refresh} disabled={loading} style={[styles.actionButton, { backgroundColor: palette.primary }]}> 
              <Text style={styles.actionText}>{loading ? 'Atualizando...' : 'Atualizar status'}</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/home')} style={styles.secondaryButton}> 
              <Text style={[styles.secondaryText, { color: palette.primary }]}>Voltar para a Home</Text>
            </Pressable>
          </>
        ) : (
          <Text style={[styles.feedback, { color: palette.text }]}>Pedido não encontrado.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  back: { fontSize: 16, fontWeight: '700', marginBottom: 22 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 18 },
  feedback: { fontSize: 16, marginBottom: 18 },
  error: { fontSize: 16, marginBottom: 18, color: '#E74C3C' },
  card: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },
  label: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  value: { fontSize: 18, fontWeight: '700' },
  notice: { marginTop: 18, fontSize: 15, lineHeight: 22 },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  actionText: { color: '#000', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});
