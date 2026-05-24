import { View, type ViewProps } from 'react-native';

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-background-card dark:bg-dark-background-card rounded-card border border-border-subtle dark:border-dark-background-elevated p-4 ${className}`}
      {...props}
    />
  );
}
