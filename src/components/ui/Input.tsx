import { TextInput, type TextInputProps, useColorScheme } from 'react-native';

import { getColors } from '@/constants/colors';

type InputProps = TextInputProps & {
  className?: string;
};

export function Input({ className = '', ...props }: InputProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark' ? 'dark' : 'light');

  return (
    <TextInput
      className={`bg-background-card dark:bg-dark-background-card border border-border dark:border-dark-background-elevated rounded-input px-4 py-3 text-body font-sans text-foreground dark:text-dark-foreground ${className}`}
      placeholderTextColor={colors.text.muted}
      {...props}
    />
  );
}
