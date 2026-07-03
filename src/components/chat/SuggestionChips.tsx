import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type SuggestionChipsProps = {
  suggestions: string[];
  disabled: boolean;
  onSelect: (suggestion: string) => void;
};

export function SuggestionChips({ suggestions, disabled, onSelect }: SuggestionChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2 px-4 py-2">
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion}
          accessibilityRole="button"
          onPress={() => onSelect(suggestion)}
          disabled={disabled}
          className={`border border-accent rounded-chip px-3 py-2 ${disabled ? 'opacity-50' : ''}`}
        >
          <Text variant="caption" className="text-accent">
            {suggestion}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
