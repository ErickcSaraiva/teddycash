import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🧸</Text>
        <Text style={styles.title}>Página não encontrada</Text>
        <Text style={styles.message}>Este endereço não existe ou não está mais disponível.</Text>
        <Link href="/" style={styles.link}>Voltar ao TeddyCash</Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0F1113' },
  emoji: { fontSize: 56, marginBottom: 18 }, title: { color: '#F0F2F5', fontSize: 28, fontWeight: '800' },
  message: { color: '#A5ABB6', textAlign: 'center', marginVertical: 12 }, link: { color: '#9B83FF', fontWeight: '700', padding: 12 },
});
