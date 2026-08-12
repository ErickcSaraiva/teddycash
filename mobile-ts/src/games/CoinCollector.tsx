import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoinCollectorGame() {
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setGameActive(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleCoinTap = () => {
    if (gameActive) {
      setCoinsCollected((c) => c + 1);
    }
  };

  const handleGameEnd = async () => {
    setSending(false);
    Alert.alert('Jogo legado desativado', 'Use o Caça às TeddyCoins em app-mobile, que valida a sessão no backend.');
  };

  return (
    <View style={styles.container}>
      {/* Header com tempo e pontuação */}
      <View style={styles.header}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Tempo</Text>
          <Text style={[styles.statValue, timeLeft < 10 && { color: '#EF4444' }]}>
            {timeLeft}s
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Moedas</Text>
          <Text style={styles.statValue}>{coinsCollected}</Text>
        </View>
      </View>

      {/* Área de jogo */}
      <View style={styles.gameArea}>
        {gameActive ? (
          <Pressable
            style={styles.coinButton}
            onPress={handleCoinTap}
            accessibilityRole="button"
            accessibilityLabel="Coletar moeda"
          >
            <MaterialCommunityIcons name="coin" size={80} color="#FFD700" />
          </Pressable>
        ) : (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverTitle}>Fim do Jogo!</Text>
            <Text style={styles.gameOverScore}>{coinsCollected} moedas</Text>
            <Pressable
              style={styles.finishButton}
              onPress={handleGameEnd}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.finishButtonText}>Finalizar & Receber</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Instruções */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {gameActive ? 'Toque na moeda o máximo que conseguir!' : 'Tempo esgotado!'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F5FF', padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '45%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: { color: '#6B7280', fontSize: 12 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#3D5AFE', marginTop: 4 },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  coinButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  gameOverContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  gameOverScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#3D5AFE',
    marginBottom: 24,
  },
  finishButton: {
    backgroundColor: '#3D5AFE',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 200,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  instructions: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  instructionText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
