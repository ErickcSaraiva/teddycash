import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
// 1. Importar o useRouter do Expo Router
import { useRouter } from 'expo-router'; 
// Vamos buscar o Custom Hook que criaste!
import { useTheme } from '@/src/contexts/ThemeContext'; 

export default function HomeScreen() {
  const { theme, particles, isLoading } = useTheme();
  
  // 2. Inicializar o router para podermos viajar entre ecrãs
  const router = useRouter(); 

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
      {/* O NOME OFICIAL AQUI!   👇 */}
      <Text style={styles.title}>TeddyCash 🐻</Text>
      <Text style={styles.subtitle}>Tema Atual: {theme.toUpperCase()}</Text>
      <Text style={styles.info}>Partículas Ativas: {particles}</Text>

      {/* 3. O nosso novo botão de Jogo! */}
      <TouchableOpacity 
        style={styles.playButton}
        onPress={() => router.push('/game')} // <-- Navega para a rota do jogo
      >
        <Text style={styles.playButtonText}>
          🎮 Jogar e Ganhar Moedas!
        </Text>
      </TouchableOpacity>
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
  // Adicionei uma margem inferior (marginBottom) para afastar o texto do botão
  info: { fontSize: 14, color: '#666', fontStyle: 'italic', marginBottom: 40 },
  
  // Estilos novinhos para o botão ficar com ar de jogo
  playButton: {
    backgroundColor: '#3D5AFE',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 5, // Dá uma sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});