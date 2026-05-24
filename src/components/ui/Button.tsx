import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { lightColors } from '@/constants/colors';

import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  label: string;
  loading?: boolean;
  className?: string;
};

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-accent rounded-button items-center justify-center min-h-[48px] px-6 py-3',
    text: 'text-button font-sans-semibold text-white',
  },
  secondary: {
    container: 'bg-background-card dark:bg-dark-background-card border border-border dark:border-dark-background-elevated rounded-button items-center justify-center min-h-[48px] px-6 py-3',
    text: 'text-button font-sans-medium text-foreground dark:text-dark-foreground',
  },
};

export function Button({
  variant = 'primary',
  label,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const styles = variantClasses[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`${styles.container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? lightColors.user.text : lightColors.text.primary} />
      ) : (
        <Text variant="body" className={styles.text}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
