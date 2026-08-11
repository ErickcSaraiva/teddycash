import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { register } = useAuth();
  const submitting = useRef(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (submitting.current) return;
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    // Validação básica
    if (!cleanUsername || !cleanEmail || !password) {
      Alert.alert('Ops!', 'Por favor, preencha todos os campos.');
      return;
    }
    if (cleanUsername.length < 3 || !/\S+@\S+\.\S+/.test(cleanEmail) || password.length < 6) {
      Alert.alert('Ops!', 'Use um nome com 3 caracteres, e-mail válido e senha com pelo menos 6 caracteres.');
      return;
    }

    submitting.current = true;
    setIsLoading(true);

    try {
      await register(cleanUsername, cleanEmail, password);

      Alert.alert('Sucesso!', 'A tua conta foi criada e você já está logado.');
      router.replace('/(tabs)/home');

    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      submitting.current = false;
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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={[styles.input, { backgroundColor: palette.card, color: palette.text, flex: 1 }]}
          placeholder="Senha"
          secureTextEntry={!showPassword}
          placeholderTextColor={palette.softText}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setShowPassword((value) => !value)} style={{ marginLeft: 10, padding: 12, borderRadius: 12, backgroundColor: '#131618' }}>
          <Text style={{ color: palette.text }}>{showPassword ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>

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
