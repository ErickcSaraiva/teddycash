import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.text }]}>Criar Conta</Text>
      <Text style={[styles.subtitle, { color: palette.softText }]}>Vamos configurar seu perfil no TeddyCash.</Text>

      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="Nome completo"
        placeholderTextColor={palette.softText}
      />
      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="E-mail"
        placeholderTextColor={palette.softText}
      />
      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="Senha"
        secureTextEntry
        placeholderTextColor={palette.softText}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: palette.primary }]}
        onPress={() => router.replace('/(tabs)')} // Ir direto para a Home após cadastro
      >
        <Text style={[styles.buttonText, { color: palette.primaryText }]}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 30 },
  input: { padding: 16, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { fontSize: 18, fontWeight: 'bold' }
});