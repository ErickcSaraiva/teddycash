/**
 * mobile-ts/src/screens/Login.tsx
 *
 * Tela de entrada do CatchUp — onboarding + login
 * Suporta: Google, Apple, Email/Senha, Telefone (OTP)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0F1113',
  surface: '#16191C',
  surfaceBorder: '#232629',
  primary: '#7C5CFC',       // roxo elétrico — cor-âncora do glow
  primaryDim: '#3D2E80',
  accent: '#F5A96B',        // laranja quente — cashback / moedas
  text: '#F0F2F5',
  textMuted: '#7A8190',
  textDim: '#3E4450',
  error: '#F25C5C',
  google: '#FFFFFF',
  apple: '#FFFFFF',
  divider: '#232629',
};

// ─── Tipos de view ─────────────────────────────────────────────────────────────
type View = 'landing' | 'email' | 'phone';

// ─── Componente principal ──────────────────────────────────────────────────────
export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const glowAnim = useRef(new Animated.Value(0.6)).current;

  // Pulso suave no glow
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const clearError = () => setError('');

  // ── Handlers mock (substituir por SDK real) ────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    clearError();
    try {
      // TODO: integrar com @react-native-google-signin/google-signin
      await new Promise((r) => setTimeout(r, 1200));
      onLoginSuccess?.();
    } catch {
      setError('Falha no login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    clearError();
    try {
      // TODO: integrar com @invertase/react-native-apple-authentication
      await new Promise((r) => setTimeout(r, 1200));
      onLoginSuccess?.();
    } catch {
      setError('Falha no login com Apple. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('E-mail inválido.');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      // TODO: chamar POST /auth/login com { email, password }
      await new Promise((r) => setTimeout(r, 1200));
      onLoginSuccess?.();
    } catch {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Número inválido. Use DDD + número.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      // TODO: integrar com Firebase Phone Auth ou similar
      await new Promise((r) => setTimeout(r, 1000));
      setOtpSent(true);
    } catch {
      setError('Não foi possível enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError('Código deve ter 6 dígitos.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      await new Promise((r) => setTimeout(r, 1000));
      onLoginSuccess?.();
    } catch {
      setError('Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // ── Glow decorativo ────────────────────────────────────────────────────────
  const GlowOrb = () => (
    <View style={styles.glowContainer} pointerEvents="none">
      <Animated.View style={[styles.glowOuter, { opacity: glowAnim }]} />
      <Animated.View style={[styles.glowMiddle, { opacity: glowAnim }]} />
      <View style={styles.glowInner} />
    </View>
  );

  // ── Logo / hero ────────────────────────────────────────────────────────────
  const Hero = () => (
    <View style={styles.hero}>
      <GlowOrb />
      <Text style={styles.logoEmoji}>🧸</Text>
      <Text style={styles.logoName}>CatchUp</Text>
      <Text style={styles.tagline}>Seu saldo, seus prêmios,{'\n'}sua diversão.</Text>
    </View>
  );

  // ── Divisor "ou" ───────────────────────────────────────────────────────────
  const Divider = () => (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>ou</Text>
      <View style={styles.dividerLine} />
    </View>
  );

  // ── Botão social ───────────────────────────────────────────────────────────
  const SocialButton = ({
    onPress,
    icon,
    label,
    disabled,
  }: {
    onPress: () => void;
    icon: string;
    label: string;
    disabled?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.socialIcon}>{icon}</Text>
      <Text style={styles.socialLabel}>{label}</Text>
    </Pressable>
  );

  // ── Tela principal (landing) ───────────────────────────────────────────────
  const LandingView = () => (
    <>
      <Hero />

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <SocialButton
          onPress={handleGoogleLogin}
          icon="G"
          label="Continuar com Google"
          disabled={loading}
        />

        {Platform.OS === 'ios' && (
          <SocialButton
            onPress={handleAppleLogin}
            icon=""
            label="Continuar com Apple"
            disabled={loading}
          />
        )}

        <Divider />

        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed]}
          onPress={() => { clearError(); setCurrentView('email'); setIsSignUp(false); }}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText}>Entrar com e-mail</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed, { marginTop: 10 }]}
          onPress={() => { clearError(); setCurrentView('phone'); }}
          accessibilityRole="button"
        >
          <Text style={styles.outlineBtnText}>Entrar com telefone</Text>
        </Pressable>

        <Pressable
          style={styles.signUpLink}
          onPress={() => { clearError(); setCurrentView('email'); setIsSignUp(true); }}
        >
          <Text style={styles.signUpLinkText}>
            Não tem conta?{' '}
            <Text style={styles.signUpLinkHighlight}>Criar agora</Text>
          </Text>
        </Pressable>
      </View>

      <Text style={styles.legalText}>
        Ao continuar, você aceita os{' '}
        <Text style={styles.legalLink}>Termos de Uso</Text>
        {' '}e a{' '}
        <Text style={styles.legalLink}>Política de Privacidade</Text>.
      </Text>
    </>
  );

  // ── Tela de e-mail ─────────────────────────────────────────────────────────
  const EmailView = () => (
    <>
      <View style={styles.backRow}>
        <Pressable onPress={() => { setCurrentView('landing'); clearError(); }} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Voltar</Text>
        </Pressable>
      </View>

      <View style={styles.emailHero}>
        <Text style={styles.viewTitle}>{isSignUp ? 'Criar conta' : 'Entrar'}</Text>
        <Text style={styles.viewSubtitle}>
          {isSignUp
            ? 'Crie sua conta para começar a ganhar prêmios.'
            : 'Acesse seus créditos e histórico.'}
        </Text>
      </View>

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(v) => { setEmail(v); clearError(); }}
            placeholder="seu@email.com"
            placeholderTextColor={C.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={[styles.inputGroup, { marginTop: 14 }]}>
          <Text style={styles.inputLabel}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(v) => { setPassword(v); clearError(); }}
            placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
            placeholderTextColor={C.textDim}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleEmailSubmit}
          />
        </View>

        {!isSignUp && (
          <Pressable style={styles.forgotLink}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
            loading && styles.btnDisabled,
          ]}
          onPress={handleEmailSubmit}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading
            ? <ActivityIndicator color={C.text} size="small" />
            : <Text style={styles.primaryBtnText}>{isSignUp ? 'Criar conta' : 'Entrar'}</Text>
          }
        </Pressable>

        <Pressable
          style={styles.signUpLink}
          onPress={() => { setIsSignUp((v) => !v); clearError(); }}
        >
          <Text style={styles.signUpLinkText}>
            {isSignUp ? 'Já tem conta? ' : 'Não tem conta? '}
            <Text style={styles.signUpLinkHighlight}>
              {isSignUp ? 'Entrar' : 'Criar agora'}
            </Text>
          </Text>
        </Pressable>
      </View>
    </>
  );

  // ── Tela de telefone ───────────────────────────────────────────────────────
  const PhoneView = () => (
    <>
      <View style={styles.backRow}>
        <Pressable
          onPress={() => { setCurrentView('landing'); setOtpSent(false); setPhone(''); setOtp(''); clearError(); }}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Voltar</Text>
        </Pressable>
      </View>

      <View style={styles.emailHero}>
        <Text style={styles.viewTitle}>{otpSent ? 'Confirmar código' : 'Entrar com telefone'}</Text>
        <Text style={styles.viewSubtitle}>
          {otpSent
            ? `Código enviado para ${phone}. Verifique seu SMS.`
            : 'Enviaremos um código de 6 dígitos por SMS.'}
        </Text>
      </View>

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!otpSent ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de telefone</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇧🇷 +55</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  value={phone}
                  onChangeText={(v) => { setPhone(v); clearError(); }}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={C.textDim}
                  keyboardType="phone-pad"
                  returnKeyType="send"
                  onSubmitEditing={handleSendOtp}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
                loading && styles.btnDisabled,
                { marginTop: 20 },
              ]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={C.text} size="small" />
                : <Text style={styles.primaryBtnText}>Enviar código</Text>
              }
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Código SMS</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 6)); clearError(); }}
                placeholder="000000"
                placeholderTextColor={C.textDim}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleOtpSubmit}
                autoFocus
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
                loading && styles.btnDisabled,
                { marginTop: 20 },
              ]}
              onPress={handleOtpSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={C.text} size="small" />
                : <Text style={styles.primaryBtnText}>Verificar código</Text>
              }
            </Pressable>

            <Pressable
              style={styles.signUpLink}
              onPress={() => { setOtpSent(false); setOtp(''); clearError(); }}
              disabled={loading}
            >
              <Text style={styles.signUpLinkText}>
                Não recebeu? <Text style={styles.signUpLinkHighlight}>Reenviar código</Text>
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {currentView === 'landing' && <LandingView />}
          {currentView === 'email' && <EmailView />}
          {currentView === 'phone' && <PhoneView />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // ── Glow
  glowContainer: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: C.primaryDim,
    opacity: 0.18,
  },
  glowMiddle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.primary,
    opacity: 0.22,
  },
  glowInner: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.primary,
    opacity: 0.35,
  },

  // ── Hero
  hero: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: 36,
    position: 'relative',
    minHeight: 220,
    justifyContent: 'flex-end',
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 10,
    zIndex: 1,
  },
  logoName: {
    fontSize: 38,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -1.5,
    zIndex: 1,
  },
  tagline: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    zIndex: 1,
  },

  // ── Card de ações
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    padding: 22,
    width: '100%',
  },

  // ── Botões sociais
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E2125',
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 10,
  },
  socialBtnPressed: { opacity: 0.75, backgroundColor: '#252A2F' },
  socialIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    width: 20,
    textAlign: 'center',
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    letterSpacing: 0.1,
  },

  // ── Divisor
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dividerText: { color: C.textMuted, fontSize: 13 },

  // ── Botão outline
  outlineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  outlineBtnPressed: { borderColor: C.primary, backgroundColor: '#1A1630' },
  outlineBtnText: { fontSize: 15, color: C.textMuted, fontWeight: '500' },

  // ── Botão primário
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnPressed: { opacity: 0.82 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },

  // ── Desabilitado
  btnDisabled: { opacity: 0.45 },

  // ── Link criar conta
  signUpLink: { marginTop: 18, alignItems: 'center' },
  signUpLinkText: { fontSize: 14, color: C.textMuted },
  signUpLinkHighlight: { color: C.primary, fontWeight: '600' },

  // ── Legal
  legalText: {
    fontSize: 12,
    color: C.textDim,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  legalLink: { color: C.textMuted, textDecorationLine: 'underline' },

  // ── Views secundárias (email / phone)
  backRow: { paddingTop: 16, marginBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 20, color: C.textMuted },
  backLabel: { fontSize: 15, color: C.textMuted },

  emailHero: { paddingTop: 20, paddingBottom: 28 },
  viewTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.8 },
  viewSubtitle: { fontSize: 14, color: C.textMuted, marginTop: 6, lineHeight: 20 },

  // ── Inputs
  inputGroup: {},
  inputLabel: { fontSize: 13, color: C.textMuted, marginBottom: 7, fontWeight: '500' },
  input: {
    backgroundColor: '#0C0E10',
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: C.text,
  },

  forgotLink: { alignSelf: 'flex-end', marginTop: 10, marginBottom: 4 },
  forgotText: { fontSize: 13, color: C.primary },

  // ── Telefone
  phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  countryCode: {
    backgroundColor: '#0C0E10',
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    justifyContent: 'center',
  },
  countryCodeText: { fontSize: 14, color: C.text },
  phoneInput: { flex: 1 },

  // ── OTP
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
  },
});
