import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
// Vamos buscar o Custom Hook que criaste!
import { useTheme } from '@/src/contexts/ThemeContext'; 

export default function HomeScreen() {
  const { theme, particles, isLoading } = useTheme();

  // Enquanto o teu backend (Express) pensa, mostramos o ecrã de carregamento
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff4500" />
        <Text style={{ marginTop: 10 }}>A sincronizar Live-Ops com o servidor...</Text>
      </View>
    );
  }

  // Aqui a magia acontece: a cor de fundo muda com base no 'theme'
  return (
    <View style={[styles.container, theme === 'christmas' ? styles.bgChristmas : styles.bgDefault]}>
      <Text style={styles.title}>Catchup Platform 🧸</Text>
      <Text style={styles.subtitle}>Tema Atual: {theme.toUpperCase()}</Text>
      <Text style={styles.info}>Partículas Ativas: {particles}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgDefault: { backgroundColor: '#f0f8ff' },   // Azul clarinho (Default)
  bgChristmas: { backgroundColor: '#ffefd5' }, // Tom pastel quente (Natal)
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 5, color: '#333' },
  info: { fontSize: 14, color: '#666', fontStyle: 'italic' }
});