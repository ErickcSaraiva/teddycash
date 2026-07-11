/**
 * app/login.tsx
 * Rota Expo Router → tela de login.
 */
import { useRouter } from 'expo-router';
import LoginScreen from '@/src/screens/Login';

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginScreen
      onLoginSuccess={() => router.replace('/(tabs)')}
    />
  );
}