import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '@/src/services/upload';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getPalette } from '@/src/theme/palettes';
import { useAuth } from '@/src/hooks/useAuth';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=7251e1&color=ffffff&size=128&rounded=true&name=T';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const router = useRouter();
  const { userId, username, email, avatarUrl, balance, logout, updateProfile } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [formUsername, setFormUsername] = useState(username ?? '');
  const [formEmail, setFormEmail] = useState(email ?? '');
  const [formAvatarUrl, setFormAvatarUrl] = useState(avatarUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const displayAvatar = useMemo(() => {
    if (formAvatarUrl) {
      return { uri: formAvatarUrl };
    }
    if (avatarUrl) {
      return { uri: avatarUrl };
    }
    return { uri: DEFAULT_AVATAR };
  }, [avatarUrl, formAvatarUrl]);

  const onSave = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: { username?: string; email?: string; avatarUrl?: string | null } = {
        username: formUsername.trim(),
        email: formEmail.trim(),
      };

      // Only include avatarUrl when the user provided a value.
      // Leaving the field blank will not clear the existing avatar on the server.
      if (formAvatarUrl.trim() !== '') {
        payload.avatarUrl = formAvatarUrl.trim();
      }

      await updateProfile(payload);
      setSuccess(true);
      setEditMode(false);
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadImage = async () => {
    setError(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de acesso à galeria negada.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      // compat com diferentes SDKs
      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (!uri) return;

      setUploading(true);
      const uploadedUrl = await uploadImageAsync(uri);
      setFormAvatarUrl(uploadedUrl);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  if (!userId) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}> 
        <Text style={[styles.title, { color: palette.text }]}>Usuário não autenticado</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/home')}>
            <Text style={[styles.back, { color: palette.primary }]}>‹ Voltar</Text>
          </Pressable>
          <Text style={[styles.title, { color: palette.text }]}>Meu perfil</Text>
        </View>

        <View style={[styles.avatarCard, { backgroundColor: palette.card }]}> 
          <Image source={displayAvatar} style={styles.avatar} />
          <Text style={[styles.name, { color: palette.text }]}>{username ?? 'Usuário'}</Text>
          <Text style={[styles.email, { color: palette.softText }]}>{email ?? 'Sem e-mail'}</Text>
          <Text style={[styles.balance, { color: palette.primary }]}>Saldo: {balance ?? '—'} créditos</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.card }]}> 
          <Text style={[styles.label, { color: palette.softText }]}>Nome de usuário</Text>
          <TextInput
            value={formUsername}
            onChangeText={setFormUsername}
            editable={editMode}
            placeholder="Seu username"
            placeholderTextColor={palette.softText}
            style={[styles.input, { color: palette.text, backgroundColor: palette.background }]}
          />

          <Text style={[styles.label, { color: palette.softText }]}>E-mail</Text>
          <TextInput
            value={formEmail}
            onChangeText={setFormEmail}
            editable={editMode}
            placeholder="seu@email.com"
            placeholderTextColor={palette.softText}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: palette.text, backgroundColor: palette.background }]}
          />

          <Text style={[styles.label, { color: palette.softText }]}>Avatar URL</Text>
          <TextInput
            value={formAvatarUrl}
            onChangeText={setFormAvatarUrl}
            editable={editMode}
            placeholder="https://..."
            placeholderTextColor={palette.softText}
            autoCapitalize="none"
            style={[styles.input, { color: palette.text, backgroundColor: palette.background }]}
          />

          {error ? <Text style={[styles.error, { color: '#E74C3C' }]}>{error}</Text> : null}
          {success ? <Text style={[styles.success, { color: palette.primary }]}>Perfil atualizado com sucesso</Text> : null}

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => setEditMode((prev) => !prev)}
              style={[styles.button, { backgroundColor: palette.primary }]}
            >
              <Text style={styles.buttonText}>{editMode ? 'Cancelar' : 'Editar perfil'}</Text>
            </Pressable>
            {editMode ? (
              <Pressable
                onPress={onSave}
                disabled={loading}
                style={[
                  styles.button,
                  { backgroundColor: loading ? palette.softText : palette.accent },
                ]}
              >
                <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={logout}
            style={[styles.logoutButton, { borderColor: palette.primary }]}
          >
            <Text style={[styles.logoutText, { color: palette.primary }]}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginTop: 60, marginBottom: 24 },
  back: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '800' },
  avatarCard: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 18,
    backgroundColor: '#EEE',
  },
  name: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  email: { fontSize: 15, marginBottom: 6 },
  balance: { fontSize: 16, fontWeight: '700' },
  formCard: {
    borderRadius: 22,
    padding: 20,
  },
  label: { fontSize: 13, marginBottom: 8, fontWeight: '700' },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
  },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  logoutButton: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: { fontSize: 14, fontWeight: '700' },
  error: { marginBottom: 12, fontSize: 14 },
  success: { marginBottom: 12, fontSize: 14 },
});
