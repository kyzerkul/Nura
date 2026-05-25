import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { fontsToLoad } from '@/constants/fonts';
import { AuthProvider } from '@/providers/AuthProvider';
import { useSession } from '@/hooks/useSession';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontsToLoad);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
