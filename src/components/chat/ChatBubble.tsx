import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  animate?: boolean;
};

const bubbleClasses: Record<ChatBubbleProps['role'], { row: string; bubble: string; text: string }> = {
  assistant: {
    row: 'flex-row justify-start',
    bubble: 'bg-companion-bubble dark:bg-dark-background-card border border-border-subtle dark:border-dark-background-elevated',
    text: 'text-foreground dark:text-dark-foreground',
  },
  user: {
    row: 'flex-row justify-end',
    bubble: 'bg-user-bubble',
    text: 'text-white',
  },
};

export function ChatBubble({ role, content, animate = true }: ChatBubbleProps) {
  const styles = bubbleClasses[role];

  return (
    <Animated.View
      entering={animate ? FadeInDown.duration(200) : undefined}
      className={`${styles.row} px-4 py-1`}
    >
      <View className={`${styles.bubble} rounded-bubble px-3 py-3 max-w-[80%]`}>
        <Text variant="body" className={styles.text}>
          {content}
        </Text>
      </View>
    </Animated.View>
  );
}
