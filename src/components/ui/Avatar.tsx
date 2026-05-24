import { View } from 'react-native';

import { Text } from './Text';

type AvatarType = 'companion' | 'user';
type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  type: AvatarType;
  label: string;
  size?: AvatarSize;
  className?: string;
};

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'w-8 h-8', text: 'text-caption' },
  md: { container: 'w-10 h-10', text: 'text-body' },
  lg: { container: 'w-16 h-16', text: 'text-heading' },
};

const typeClasses: Record<AvatarType, string> = {
  companion: 'bg-companion-avatar',
  user: 'bg-user-avatar',
};

export function Avatar({ type, label, size = 'md', className = '' }: AvatarProps) {
  const sizeStyle = sizeClasses[size];

  return (
    <View
      className={`${sizeStyle.container} ${typeClasses[type]} rounded-avatar items-center justify-center ${className}`}
    >
      <Text variant="body" className={`${sizeStyle.text} text-white font-sans-semibold`}>
        {label}
      </Text>
    </View>
  );
}
