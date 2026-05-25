import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';

export default function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <View className="flex-1 items-center justify-center px-4">
        <Text variant="heading" className="text-center">
          Chat{/* TODO: i18n */}
        </Text>
        <Text variant="body" className="text-foreground-muted dark:text-dark-foreground-muted text-center mt-2">
          Bientôt disponible{/* TODO: i18n */}
        </Text>
      </View>
    </SafeAreaView>
  );
}
