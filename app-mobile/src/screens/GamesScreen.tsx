// src/screens/GamesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getPalette } from '../theme/palettes';
import { submitGameScore } from '../services/gamesApi';

type Props = {
  userId?: string;
};

export default function GamesScreen({ userId = 'user1' }: Props) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  
  const [clicks, setClicks] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleTap = async () => {
    if (isLoading) return;

    const newClicks = clicks + 1;
    setClicks(newClicks);

    // Quando chegar a 10 cliques, ganha 50 moedas!
    if (newClicks >= 10) {
      setIsLoading(true);
      try {
        await submitGameScore(userId, 50);
        Alert.alert('🎉 Parabéns!', 'Ganhaste 50 TeddyCoins!');
      } catch (error) {
        Alert.alert('Erro', 'Ocorreu um erro ao validar a tua pontuação. O Anti-Cheat pode ter bloqueado.');
      } finally {
        setClicks(0);
        setIsLoading(false);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: palette.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: palette.softText,
      marginBottom: 40,
    },
    gameButton: {
      backgroundColor: palette.primary,
      width: 200,
      height: 200,
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    buttonText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: palette.primaryText,
    },
    progressText: {
      marginTop: 30,
      fontSize: 18,
      fontWeight: '600',
      color: palette.accent,
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teddy Clicker 🐻</Text>
      <Text style={styles.subtitle}>Toca 10 vezes no botão para ganhares moedas!</Text>

      <TouchableOpacity 
        style={styles.gameButton} 
        onPress={handleTap}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={palette.primaryText} />
        ) : (
          <Text style={styles.buttonText}>TOCA!</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.progressText}>Cliques: {clicks} / 10</Text>
    </View>
  );
}