import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MoodPicker } from '@/components/ui/MoodPicker';
import { Text } from '@/components/ui/Text';

export default function DesignPreviewScreen() {
  const [mood, setMood] = useState<number | undefined>();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-6 py-6">
        <Text variant="brand">nura</Text>
        <Text variant="display">Bonjour Aïcha</Text>
        <Text variant="heading">Design System</Text>
        <Text variant="subheading">Base components preview</Text>
        <Text variant="body">
          This screen previews all design system primitives.
        </Text>
        <Text variant="caption">Caption text for timestamps</Text>

        <View className="flex-row gap-3">
          <Avatar type="companion" label="n" size="sm" />
          <Avatar type="companion" label="n" size="md" />
          <Avatar type="companion" label="n" size="lg" />
          <Avatar type="user" label="A" size="md" />
        </View>

        <Card>
          <Text variant="subheading">Card component</Text>
          <Text variant="body" className="text-foreground-secondary dark:text-dark-foreground-secondary mt-1">
            Content inside a card container.
          </Text>
        </Card>

        <Button variant="primary" label="Parler à nura" onPress={() => {}} />
        <Button variant="secondary" label="Mon journal" onPress={() => {}} />
        <Button variant="primary" label="Loading..." loading onPress={() => {}} />

        <Input placeholder="Écrire un message..." />

        <Card>
          <Text variant="subheading" className="mb-3">
            Comment te sens-tu ?
          </Text>
          <MoodPicker selected={mood} onSelect={setMood} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
