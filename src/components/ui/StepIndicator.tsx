import { View } from 'react-native';

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < currentStep
              ? 'bg-accent'
              : 'border border-foreground-muted'
          }`}
        />
      ))}
    </View>
  );
}
