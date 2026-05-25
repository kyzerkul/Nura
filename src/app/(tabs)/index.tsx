import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/hooks/useSession';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HomeScreen() {
  const { signOut } = useSession();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-6 py-6">
        <Text variant="brand">nura</Text>
        <Text variant="display">
          Bonjour{/* TODO: i18n — insert user name */}
        </Text>

        <Card>
          <Text variant="subheading">
            Bienvenue sur Nura{/* TODO: i18n */}
          </Text>
          <Text variant="body" className="text-foreground-secondary dark:text-dark-foreground-secondary mt-1">
            Ton espace est prêt. Les fonctionnalités arrivent bientôt.{/* TODO: i18n */}
          </Text>
        </Card>

        <Button
          variant="secondary"
          label="Se déconnecter" // TODO: i18n
          onPress={signOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
