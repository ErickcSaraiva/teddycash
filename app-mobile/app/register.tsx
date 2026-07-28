import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
// Agora vamos usar a API centralizada que criamos na Etapa 3
import { authApi } from '../src/services/authApi';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validação básica
    if (!username || !email || !password) {
      Alert.alert('Ops!', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Cria a conta na API
      await authApi.register(username, email, password);

      // 2. Faz o login automático logo em seguida para pegar o Token
      const loginData = await authApi.login(email, password);

      // 3. Testa se o token chegou mesmo (olha o terminal do Expo!)
      console.log("Token recebido com sucesso:", loginData.access_token);

      Alert.alert('Sucesso!', 'A tua conta foi criada e você já está logado.');
      
      // 4. Redireciona para a Home
      router.replace('/(tabs)');

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
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="E-mail"
        placeholderTextColor={palette.softText}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput 
        style={[styles.input, { backgroundColor: palette.card, color: palette.text }]}
        placeholder="Senha"
        secureTextEntry
        placeholderTextColor={palette.softText}
        value={password}
        onChangeText={setPassword}
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