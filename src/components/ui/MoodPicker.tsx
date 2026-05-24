import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Text } from './Text';

const MOODS = ['😞', '😕', '🙂', '😊', '😍'] as const;

type MoodPickerProps = {
  selected?: number;
  onSelect: (index: number) => void;
  className?: string;
};

function MoodItem({
  emoji,
  isSelected,
  onPress,
}: {
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.2 : 1, { damping: 12, stiffness: 180 });
  }, [isSelected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={animatedStyle}
        className={`w-12 h-12 rounded-avatar items-center justify-center ${
          isSelected
            ? 'border-2 border-accent'
            : 'border border-dashed border-border dark:border-dark-foreground-muted'
        }`}
      >
        <Text variant="heading" className="text-center">
          {emoji}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function MoodPicker({ selected, onSelect, className = '' }: MoodPickerProps) {
  return (
    <View className={`flex-row justify-between px-4 ${className}`}>
      {MOODS.map((emoji, index) => (
        <MoodItem
          key={index}
          emoji={emoji}
          isSelected={selected === index}
          onPress={() => onSelect(index)}
        />
      ))}
    </View>
  );
}
