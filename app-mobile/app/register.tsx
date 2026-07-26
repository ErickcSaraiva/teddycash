import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);

  // 1. Estados para guardar o que é digitado
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Função que liga ao Backend
  const handleRegister = async () => {
    // Validação básica
    if (!username || !email || !password) {
      Alert.alert('Ops!', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      // ⚠️ ATENÇÃO AO IP: 
      // Se usares emulador Android, tenta 'http://10.0.2.2:3000/auth/register'
      // Se usares o telemóvel físico, coloca o IP do teu computador (ex: 'http://192.168.1.15:3000/auth/register')
      const response = await fetch('http://192.168.101.13:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar a conta.');
      }

      // Deu tudo certo!
      Alert.alert('Sucesso!', 'A tua conta foi criada.');
      router.replace({ pathname: '/(tabs)' as any }); // Vai para a Home

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.text }]}>Criar Conta</Text>
      <Text style={[styles.subtitle, { color: palette.softText }]}>Vamos configurar seu perfil no TeddyCash.</Text>

      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="Nome de utilizador"
        placeholderTextColor={palette.softText}
        value={username}
        onChangeText={setUsername} // Salva o nome
        autoCapitalize="none"
      />
      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="E-mail"
        placeholderTextColor={palette.softText}
        value={email}
        onChangeText={setEmail} // Salva o email
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="Senha"
        secureTextEntry
        placeholderTextColor={palette.softText}
        value={password}
        onChangeText={setPassword} // Salva a senha
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: palette.primary, opacity: isLoading ? 0.7 : 1 }]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <Text style={[styles.buttonText, { color: palette.text }]}>Começar</Text>
        )}
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