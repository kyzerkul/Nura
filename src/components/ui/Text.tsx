import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type TextVariant = 'display' | 'heading' | 'subheading' | 'body' | 'caption' | 'brand';

type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
};

const variantClasses: Record<TextVariant, string> = {
  display: 'text-display font-sans-bold text-foreground dark:text-dark-foreground',
  heading: 'text-heading font-sans-semibold text-foreground dark:text-dark-foreground',
  subheading: 'text-subheading font-sans-medium text-foreground dark:text-dark-foreground',
  body: 'text-body font-sans text-foreground dark:text-dark-foreground',
  caption: 'text-caption font-sans text-foreground-muted dark:text-dark-foreground-muted',
  brand: 'text-display font-brand text-accent',
};

export function Text({ variant = 'body', className = '', ...props }: TextProps) {
  return (
    <RNText
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
