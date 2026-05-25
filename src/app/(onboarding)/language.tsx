import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { t } from '@/constants/onboarding-i18n';

type Language = 'fr' | 'en';

const LANGUAGES: { code: Language; flag: string; label: string; sub: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français', sub: 'Je parle français' },
  { code: 'en', flag: '🇬🇧', label: 'English', sub: 'I speak English' },
];

export default function LanguageScreen() {
  const [selected, setSelected] = useState<Language>('fr');
  const i = t(selected);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background px-6">
      <View className="flex-1 justify-center">
        <Text
          variant="display"
          className="text-center mb-8 text-foreground dark:text-dark-foreground"
        >
          {i.language.heading}
        </Text>

        <View className="gap-4">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => setSelected(lang.code)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${lang.label}. ${lang.sub}`}
                className={`flex-row items-center gap-4 p-4 rounded-card border ${
                  isSelected
                    ? 'border-accent bg-accent-soft/20'
                    : 'border-border-subtle bg-background-card dark:bg-dark-background-card'
                }`}
              >
                <Text variant="heading">{lang.flag}</Text>
                <View className="flex-1">
                  <Text
                    variant="subheading"
                    className="text-foreground dark:text-dark-foreground"
                  >
                    {lang.label}
                  </Text>
                  <Text
                    variant="caption"
                    className="text-foreground-muted dark:text-dark-foreground-muted"
                  >
                    {lang.sub}
                  </Text>
                </View>
                {isSelected && (
                  <View className="h-6 w-6 rounded-full bg-accent items-center justify-center">
                    <Text variant="caption" className="text-white text-[14px]">
                      ✓
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="pb-4 gap-6">
        <StepIndicator currentStep={2} totalSteps={4} />
        <Button
          variant="primary"
          label={i.language.next}
          onPress={() =>
            router.push(`/(onboarding)/companion?lang=${selected}` as Href)
          }
        />
        <Pressable onPress={() => router.back()}>
          <Text
            variant="caption"
            className="text-accent-blue text-center"
          >
            {i.language.back}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
