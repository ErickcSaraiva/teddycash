// mobile-ts/src/screens/Login.tsx

import React, { useState, useRef, useCallback } from 'react';
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

const C = {
  bg: '#0F1113',
  surface: '#16191C',
  surfaceBorder: '#232629',
  primary: '#7C5CFC',
  primaryDim: '#3D2E80',
  accent: '#F5A96B',
  text: '#F0F2F5',
  textMuted: '#7A8190',
  textDim: '#3E4450',
  error: '#F25C5C',
  google: '#FFFFFF',
  apple: '#FFFFFF',
  divider: '#232629',
};

type ViewName = 'landing' | 'email' | 'phone';

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponentes FORA do LoginScreen — evita remount a cada render
// ─────────────────────────────────────────────────────────────────────────────

const GlowOrb = ({ glowAnim }: { glowAnim: Animated.Value }) => (
  <View style={styles.glowContainer} pointerEvents="none">
    <Animated.View style={[styles.glowOuter, { opacity: glowAnim }]} />
    <Animated.View style={[styles.glowMiddle, { opacity: glowAnim }]} />
    <View style={styles.glowInner} />
  </View>
);

const Hero = ({ glowAnim }: { glowAnim: Animated.Value }) => (
  <View style={styles.hero}>
    <GlowOrb glowAnim={glowAnim} />
    <Text style={styles.logoEmoji}>🧸</Text>
    <Text style={styles.logoName}>TeddyCash</Text>
    <Text style={styles.tagline}>Seu saldo, seus prêmios,{'\n'}sua diversão.</Text>
  </View>
);

const Divider = () => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>ou</Text>
    <View style={styles.dividerLine} />
  </View>
);

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
    style={({ pressed }) => [
      styles.socialBtn,
      pressed && styles.socialBtnPressed,
      disabled && styles.btnDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Text style={styles.socialIcon}>{icon}</Text>
    <Text style={styles.socialLabel}>{label}</Text>
  </Pressable>
);

// ── LandingView ───────────────────────────────────────────────────────────────
type LandingViewProps = {
  glowAnim: Animated.Value;
  loading: boolean;
  error: string;
  onGoogle: () => void;
  onApple: () => void;
  onEmailLogin: () => void;
  onPhone: () => void;
  onSignUp: () => void;
};

const LandingView = ({
  glowAnim,
  loading,
  error,
  onGoogle,
  onApple,
  onEmailLogin,
  onPhone,
  onSignUp,
}: LandingViewProps) => (
  <>
    <Hero glowAnim={glowAnim} />
    <View style={styles.card}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <SocialButton onPress={onGoogle} icon="G" label="Continuar com Google" disabled={loading} />

      {Platform.OS === 'ios' && (
        <SocialButton onPress={onApple} icon="" label="Continuar com Apple" disabled={loading} />
      )}

      <Divider />

      <Pressable
        style={({ pressed }) => [styles.outlineBtn, pressed && styles.outlineBtnPressed]}
        onPress={onEmailLogin}
        accessibilityRole="button"
      >
        <Text style={styles.outlineBtnText}>Entrar com e-mail</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.outlineBtn,
          pressed && styles.outlineBtnPressed,
          { marginTop: 10 },
        ]}
        onPress={onPhone}
        accessibilityRole="button"
      >
        <Text style={styles.outlineBtnText}>Entrar com telefone</Text>
      </Pressable>

      <Pressable style={styles.signUpLink} onPress={onSignUp}>
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

// ── EmailView ─────────────────────────────────────────────────────────────────
type EmailViewProps = {
  isSignUp: boolean;
  loading: boolean;
  error: string;
  email: string;
  password: string;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onToggleSignUp: () => void;
};

const EmailView = ({
  isSignUp,
  loading,
  error,
  email,
  password,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onBack,
  onToggleSignUp,
}: EmailViewProps) => (
  <>
    <View style={styles.backRow}>
      <Pressable onPress={onBack} style={styles.backBtn}>
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
          onChangeText={onChangeEmail}
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
          onChangeText={onChangePassword}
          placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
          placeholderTextColor={C.textDim}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={onSubmit}
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
        onPress={onSubmit}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={C.text} size="small" />
        ) : (
          <Text style={styles.primaryBtnText}>{isSignUp ? 'Criar conta' : 'Entrar'}</Text>
        )}
      </Pressable>

      <Pressable style={styles.signUpLink} onPress={onToggleSignUp}>
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

// ── PhoneView ─────────────────────────────────────────────────────────────────
type PhoneViewProps = {
  loading: boolean;
  error: string;
  phone: string;
  otp: string;
  otpSent: boolean;
  onChangePhone: (v: string) => void;
  onChangeOtp: (v: string) => void;
  onSendOtp: () => void;
  onOtpSubmit: () => void;
  onBack: () => void;
  onResend: () => void;
};

const PhoneView = ({
  loading,
  error,
  phone,
  otp,
  otpSent,
  onChangePhone,
  onChangeOtp,
  onSendOtp,
  onOtpSubmit,
  onBack,
  onResend,
}: PhoneViewProps) => (
  <>
    <View style={styles.backRow}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Voltar</Text>
      </Pressable>
    </View>

    <View style={styles.emailHero}>
      <Text style={styles.viewTitle}>
        {otpSent ? 'Confirmar código' : 'Entrar com telefone'}
      </Text>
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
                onChangeText={onChangePhone}
                placeholder="(11) 99999-9999"
                placeholderTextColor={C.textDim}
                keyboardType="phone-pad"
                returnKeyType="send"
                onSubmitEditing={onSendOtp}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
              loading && styles.btnDisabled,
              { marginTop: 40 },
            ]}
            onPress={onSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.text} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Enviar código</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Código SMS</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otp}
              onChangeText={onChangeOtp}
              placeholder="000000"
              placeholderTextColor={C.textDim}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={onOtpSubmit}
              autoFocus
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
              loading && styles.btnDisabled,
              { marginTop: 40 },
            ]}
            onPress={onOtpSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.text} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Verificar código</Text>
            )}
          </Pressable>

          <Pressable style={styles.signUpLink} onPress={onResend} disabled={loading}>
            <Text style={styles.signUpLinkText}>
              Não recebeu?{' '}
              <Text style={styles.signUpLinkHighlight}>Reenviar código</Text>
            </Text>
          </Pressable>
        </>
      )}
    </View>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [currentView, setCurrentView] = useState<ViewName>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const glowAnim = useRef(new Animated.Value(0.6)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const clearError = useCallback(() => setError(''), []);

  // Handlers estáveis com useCallback — evita referências novas a cada render
  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      await new Promise((r) => setTimeout(r, 1200));
      onLoginSuccess?.();
    } catch {
      setError('Falha no login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onLoginSuccess, clearError]);

  const handleAppleLogin = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      await new Promise((r) => setTimeout(r, 1200));
      onLoginSuccess?.();
    } catch {
      setError('Falha no login com Apple. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onLoginSuccess, clearError]);

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) { setError('Preencha e-mail e senha.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('E-mail inválido.'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    clearError();
    try {
      await new Promise((r) => setTimeout(r, 1200));
      onLoginSuccess?.();
    } catch {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }, [email, password, onLoginSuccess, clearError]);

  const handleSendOtp = useCallback(async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Número inválido. Use DDD + número.'); return; }
    setLoading(true);
    clearError();
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setOtpSent(true);
    } catch {
      setError('Não foi possível enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [phone, clearError]);

  const handleOtpSubmit = useCallback(async () => {
    if (otp.length !== 6) { setError('Código deve ter 6 dígitos.'); return; }
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
  }, [otp, onLoginSuccess, clearError]);

  const handleChangeEmail = useCallback((v: string) => {
    setEmail(v);
    clearError();
  }, [clearError]);

  const handleChangePassword = useCallback((v: string) => {
    setPassword(v);
    clearError();
  }, [clearError]);

  const handleChangePhone = useCallback((v: string) => {
    setPhone(v);
    clearError();
  }, [clearError]);

  const handleChangeOtp = useCallback((v: string) => {
    setOtp(v.replace(/\D/g, '').slice(0, 6));
    clearError();
  }, [clearError]);

  const goToEmailLogin = useCallback(() => {
    clearError(); setCurrentView('email'); setIsSignUp(false);
  }, [clearError]);

  const goToPhone = useCallback(() => {
    clearError(); setCurrentView('phone');
  }, [clearError]);

  const goToSignUp = useCallback(() => {
    clearError(); setCurrentView('email'); setIsSignUp(true);
  }, [clearError]);

  const goToLanding = useCallback(() => {
    setCurrentView('landing'); clearError();
  }, [clearError]);

  const goToLandingFromPhone = useCallback(() => {
    setCurrentView('landing');
    setOtpSent(false);
    setPhone('');
    setOtp('');
    clearError();
  }, [clearError]);

  const toggleSignUp = useCallback(() => {
    setIsSignUp((v) => !v);
    clearError();
  }, [clearError]);

  const handleResend = useCallback(() => {
    setOtpSent(false);
    setOtp('');
    clearError();
  }, [clearError]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {currentView === 'landing' && (
            <LandingView
              glowAnim={glowAnim}
              loading={loading}
              error={error}
              onGoogle={handleGoogleLogin}
              onApple={handleAppleLogin}
              onEmailLogin={goToEmailLogin}
              onPhone={goToPhone}
              onSignUp={goToSignUp}
            />
          )}

          {currentView === 'email' && (
            <EmailView
              isSignUp={isSignUp}
              loading={loading}
              error={error}
              email={email}
              password={password}
              onChangeEmail={handleChangeEmail}
              onChangePassword={handleChangePassword}
              onSubmit={handleEmailSubmit}
              onBack={goToLanding}
              onToggleSignUp={toggleSignUp}
            />
          )}

          {currentView === 'phone' && (
            <PhoneView
              loading={loading}
              error={error}
              phone={phone}
              otp={otp}
              otpSent={otpSent}
              onChangePhone={handleChangePhone}
              onChangeOtp={handleChangeOtp}
              onSendOtp={handleSendOtp}
              onOtpSubmit={handleOtpSubmit}
              onBack={goToLandingFromPhone}
              onResend={handleResend}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos (idênticos ao original) ──────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  glowContainer: {
    position: 'absolute', top: -40, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute', width: 260, height: 260,
    borderRadius: 130, backgroundColor: C.primaryDim, opacity: 0.18,
  },
  glowMiddle: {
    position: 'absolute', width: 160, height: 160,
    borderRadius: 80, backgroundColor: C.primary, opacity: 0.22,
  },
  glowInner: {
    position: 'absolute', width: 70, height: 70,
    borderRadius: 35, backgroundColor: C.primary, opacity: 0.35,
  },
  hero: {
    alignItems: 'center',
    paddingTop: height * 0.07,
    paddingBottom: 28,
    position: 'relative',
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  logoEmoji: { fontSize: 56, marginBottom: 10, zIndex: 1 },
  logoName: { fontSize: 38, fontWeight: '900', color: C.text, letterSpacing: -1.5, zIndex: 1 },
  tagline: { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 8, zIndex: 1 },
  card: {
    backgroundColor: C.surface, borderRadius: 24,
    borderWidth: 1, borderColor: C.surfaceBorder, padding: 22, width: '100%',
  },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E2125', borderWidth: 1, borderColor: C.surfaceBorder,
    borderRadius: 14, paddingVertical: 14, marginBottom: 10, gap: 10,
  },
  socialBtnPressed: { opacity: 0.75, backgroundColor: '#252A2F' },
  socialIcon: { fontSize: 16, fontWeight: '800', color: C.text, width: 20, textAlign: 'center' },
  socialLabel: { fontSize: 15, fontWeight: '600', color: C.text, letterSpacing: 0.1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dividerText: { color: C.textMuted, fontSize: 13 },
  outlineBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.surfaceBorder,
    borderRadius: 14, paddingVertical: 14, backgroundColor: 'transparent',
  },
  outlineBtnPressed: { borderColor: C.primary, backgroundColor: '#1A1630' },
  outlineBtnText: { fontSize: 15, color: C.textMuted, fontWeight: '500' },
  primaryBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, marginTop: 4,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  primaryBtnPressed: { opacity: 0.82 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  btnDisabled: { opacity: 0.45 },
  signUpLink: { marginTop: 18, alignItems: 'center' },
  signUpLinkText: { fontSize: 14, color: C.textMuted },
  signUpLinkHighlight: { color: C.primary, fontWeight: '600' },
  legalText: { fontSize: 12, color: C.textDim, textAlign: 'center', marginTop: 20, lineHeight: 18 },
  legalLink: { color: C.textMuted, textDecorationLine: 'underline' },
  backRow: { paddingTop: 40, marginBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 20, color: C.textMuted },
  backLabel: { fontSize: 15, color: C.textMuted },
  emailHero: { paddingTop: 20, paddingBottom: 28 },
  viewTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.8 },
  viewSubtitle: { fontSize: 14, color: C.textMuted, marginTop: 6, lineHeight: 20 },
  inputGroup: {},
  inputLabel: { fontSize: 13, color: C.textMuted, marginBottom: 7, fontWeight: '500' },
  input: {
    backgroundColor: '#0C0E10', borderWidth: 1, borderColor: C.surfaceBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: C.text,
  },
  forgotLink: { alignSelf: 'flex-end', marginTop: 10, marginBottom: 4 },
  forgotText: { fontSize: 13, color: C.primary },
  phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  countryCode: {
    backgroundColor: '#0C0E10', borderWidth: 1, borderColor: C.surfaceBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, justifyContent: 'center',
  },
  countryCodeText: { fontSize: 14, color: C.text },
  phoneInput: { flex: 1 },
  otpInput: { fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 8 },
  errorText: {
    color: C.error, fontSize: 13, marginBottom: 14,
    backgroundColor: '#2A1414', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
});