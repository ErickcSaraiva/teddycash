import LoginScreen from '@/src/screens/Login';
import { useRouter } from 'expo-router';

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginScreen
      onLoginSuccess={() => {
        router.replace('/(tabs)');
      }}
    />
  );
}