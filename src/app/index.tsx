import { Redirect } from 'expo-router';
import { useSession } from '@/hooks/useSession';

export default function Index() {
  const { session } = useSession();

  if (session) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(auth)/login" />;
}
