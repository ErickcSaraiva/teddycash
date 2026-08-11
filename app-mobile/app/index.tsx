import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';

export default function Index() {
  const { token, loading } = useAuth();
  if (loading) return <View><ActivityIndicator /></View>;
  return <Redirect href={token ? '/(tabs)/home' : '/login'} />;
}
