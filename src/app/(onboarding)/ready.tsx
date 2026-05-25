import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useSession';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { COMPANION_PRESETS } from '@/constants/companions';
import { mapAuthError } from '@/lib/auth-errors';

export default function ReadyScreen() {
  const { lang, companion } = useLocalSearchParams<{
    lang: string;
    companion: string;
  }>();
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companionIndex = Number(companion ?? 0);
  const preset = COMPANION_PRESETS[companionIndex] ?? COMPANION_PRESETS[0];
  const selectedLang = (lang === 'en' ? 'en' : 'fr') as 'fr' | 'en';

  const handleComplete = async () => {
    if (!session?.user?.id) return;

    setError('');
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ language: selectedLang })
        .eq('id', session.user.id);

      if (profileError) {
        setError(mapAuthError(profileError.message));
        return;
      }

      const { error: companionError } = await supabase
        .from('companions')
        .insert({
          user_id: session.user.id,
          name: preset.name,
          persona: preset.persona,
          tone: preset.tone,
          is_active: true,
        });

      if (companionError) {
        setError(mapAuthError(companionError.message));
        return;
      }

      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background px-6">
      <View className="flex-1 justify-center items-center">
        <Text className="text-[64px] mb-6">{preset.emoji}</Text>

        <Text
          variant="display"
          className="text-center mb-4 text-foreground dark:text-dark-foreground"
        >
          Prête à commencer ?{/* TODO: i18n */}
        </Text>

        <Text
          variant="body"
          className="text-foreground-secondary dark:text-dark-foreground-secondary text-center mb-8 px-4"
        >
          {preset.name} est là pour toi. Parle-lui de ce que tu veux, quand tu
          veux.{/* TODO: i18n */}
        </Text>

        <Text
          variant="caption"
          className="text-foreground-muted dark:text-dark-foreground-muted text-center"
        >
          Tes conversations sont privées et sécurisées 🔒{/* TODO: i18n */}
        </Text>
      </View>

      {error ? (
        <Text variant="caption" className="text-status-error text-center mb-4">
          {error}
        </Text>
      ) : null}

      <View className="pb-4 gap-6">
        <StepIndicator currentStep={4} totalSteps={4} />
        <Button
          variant="primary"
          label="Commencer à parler" // TODO: i18n
          loading={loading}
          onPress={handleComplete}
        />
        <Pressable onPress={() => router.back()} disabled={loading}>
          <Text variant="caption" className="text-accent-blue text-center">
            ← Retour{/* TODO: i18n */}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
