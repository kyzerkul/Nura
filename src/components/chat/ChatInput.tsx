import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, TextInput, View, useColorScheme } from 'react-native';

import { getColors } from '@/constants/colors';

const MAX_MESSAGE_LENGTH = 2000;

type ChatInputProps = {
  placeholder: string;
  sendLabel: string;
  disabled: boolean;
  onSend: (text: string) => void;
};

export function ChatInput({ placeholder, sendLabel, disabled, onSend }: ChatInputProps) {
  const [text, setText] = useState('');
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark' ? 'dark' : 'light');

  const canSend = !disabled && text.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    const value = text;
    setText('');
    onSend(value);
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-2">
      <TextInput
        className="flex-1 bg-background-card dark:bg-dark-background-card border border-border dark:border-dark-background-elevated rounded-input px-4 py-3 text-body font-sans text-foreground dark:text-dark-foreground max-h-[120px]"
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
        editable={!disabled}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sendLabel}
        onPress={handleSend}
        disabled={!canSend}
        className={`w-11 h-11 rounded-button items-center justify-center bg-accent ${canSend ? '' : 'opacity-50'}`}
      >
        <Feather name="arrow-up" size={22} color={colors.user.text} />
      </Pressable>
    </View>
  );
}
