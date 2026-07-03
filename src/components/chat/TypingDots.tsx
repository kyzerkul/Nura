import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 250 }),
          withTiming(0.3, { duration: 250 }),
        ),
        -1,
      ),
    );
  }, [opacity, delay]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={animatedStyle}
      className="w-2 h-2 rounded-full bg-foreground-muted dark:bg-dark-foreground-muted"
    />
  );
}

export function TypingDots() {
  return (
    <View className="flex-row items-center gap-1.5 px-1 py-1">
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}
