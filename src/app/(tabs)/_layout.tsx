import { Redirect, Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useColorScheme } from 'react-native';

import { useSession } from '@/hooks/useSession';
import { getColors } from '@/constants/colors';

export default function TabsLayout() {
  const { session } = useSession();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark' ? 'dark' : 'light');

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: scheme === 'dark' ? colors.background.card : colors.background.card,
          borderTopColor: scheme === 'dark' ? colors.border.subtle : colors.border.subtle,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil', // TODO: i18n
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat', // TODO: i18n
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal', // TODO: i18n
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Moi', // TODO: i18n
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
