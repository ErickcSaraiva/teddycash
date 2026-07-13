import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes'; // 1. Importamos o tradutor de paletas

export default function HomeScreen() {
  const { theme } = useTheme(); 
  const palette = getPalette(theme); // 2. Transformamos a string (ex: 'default') nas cores reais!

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.greeting, { color: palette.text }]}>Olá, Erick 👋</Text>
      
      {/* Card de Saldo e Moedas */}
      <View style={[styles.card, { backgroundColor: palette.card }]}>
        <Text style={{ color: palette.softText }}>Saldo disponível</Text>
        <Text style={[styles.balance, { color: palette.primary }]}>R$ 0,00</Text>
        
        <View style={styles.divider} />
        
        <Text style={{ color: palette.softText }}>Moedas</Text>
        <Text style={[styles.coins, { color: palette.accent }]}>0 🪙</Text>
      </View>

      {/* Título das Ações */}
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        O que vamos fazer hoje?
      </Text>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  greeting: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 60, 
    marginBottom: 20 
  },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  balance: { 
    fontSize: 36, 
    fontWeight: '800', 
    marginVertical: 8 
  },
  coins: { 
    fontSize: 24, 
    fontWeight: '700' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#EEEEEE', 
    marginVertical: 15 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 15
  }
});