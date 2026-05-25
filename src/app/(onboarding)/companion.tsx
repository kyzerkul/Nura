import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';


import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { COMPANION_PRESETS } from '@/constants/companions';

export default function CompanionScreen() {
  const { lang } = useLocalSearchParams<{ lang: string }>();
  const [selected, setSelected] = useState<number | null>(null);

  const selectedPreset = selected !== null ? COMPANION_PRESETS[selected] : null;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background px-6">
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow justify-center py-8"
        showsVerticalScrollIndicator={false}
      >
        <Text
          variant="display"
          className="text-center mb-2 text-foreground dark:text-dark-foreground"
        >
          Choisis ta confidente{/* TODO: i18n */}
        </Text>
        <Text
          variant="caption"
          className="text-foreground-muted dark:text-dark-foreground-muted text-center mb-8"
        >
          Tu pourras changer plus tard{/* TODO: i18n */}
        </Text>

        <View className="gap-4">
          {COMPANION_PRESETS.map((preset, index) => {
            const isSelected = selected === index;
            return (
              <Pressable
                key={preset.name}
                onPress={() => setSelected(index)}
                className={`flex-row items-center gap-4 p-4 rounded-card border ${
                  isSelected
                    ? 'border-accent bg-accent-soft/20'
                    : 'border-border-subtle bg-background-card dark:bg-dark-background-card'
                }`}
              >
                <Text className="text-[36px]">{preset.emoji}</Text>
                <View className="flex-1">
                  <Text
                    variant="subheading"
                    className="text-foreground dark:text-dark-foreground"
                  >
                    {preset.name}
                  </Text>
                  <Text
                    variant="caption"
                    className="text-foreground-secondary dark:text-dark-foreground-secondary"
                  >
                    {preset.description}
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
      </ScrollView>

      <View className="pb-4 gap-6">
        <StepIndicator currentStep={3} totalSteps={4} />
        <Button
          variant="primary"
          label={selectedPreset ? `Choisir ${selectedPreset.name}` : 'Choisis une confidente'} // TODO: i18n
          onPress={() =>
            router.push(
              `/(onboarding)/ready?lang=${lang ?? 'fr'}&companion=${selected}` as Href,
            )
          }
          disabled={selected === null}
        />
        <Pressable onPress={() => router.back()}>
          <Text variant="caption" className="text-accent-blue text-center">
            ← Retour{/* TODO: i18n */}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
