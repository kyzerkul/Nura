import { Redirect, Stack, type Href } from 'expo-router';
import { useSession } from '@/hooks/useSession';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

export default function OnboardingLayout() {
  const { session } = useSession();
  const { needsOnboarding, isLoading } = useOnboardingStatus();

  if (!session) return <Redirect href="/(auth)/login" />;
  if (isLoading) return null;
  if (!needsOnboarding) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
