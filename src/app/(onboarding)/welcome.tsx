import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { t } from '@/constants/onboarding-i18n';

const i = t('fr');

const FEATURES = [
  { emoji: '🤝', text: i.welcome.feature1 },
  { emoji: '🔒', text: i.welcome.feature2 },
  { emoji: '💬', text: i.welcome.feature3 },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background px-6">
      <View className="flex-1 justify-center items-center">
        <Text variant="brand" className="text-[48px] mb-2">
          nura
        </Text>

        <Text
          variant="subheading"
          className="text-foreground-secondary dark:text-dark-foreground-secondary text-center mb-12"
        >
          {i.welcome.tagline}
        </Text>

        <View className="w-full gap-6 mb-12">
          {FEATURES.map((feature) => (
            <View key={feature.emoji} className="flex-row items-center gap-4 px-4">
              <Text variant="heading">{feature.emoji}</Text>
              <Text
                variant="body"
                className="flex-1 text-foreground dark:text-dark-foreground"
              >
                {feature.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="pb-4 gap-6">
        <StepIndicator currentStep={1} totalSteps={4} />
        <Button
          variant="primary"
          label={i.welcome.cta}
          onPress={() => router.push('/(onboarding)/language' as Href)}
        />
      </View>
    </SafeAreaView>
  );
}
