import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { mapAuthError } from '@/lib/auth-errors';

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError('');

    if (displayName.trim().length < 2 || displayName.trim().length > 30) {
      setError('Le nom doit contenir entre 2 et 30 caractères'); // TODO: i18n
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Adresse email invalide'); // TODO: i18n
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères'); // TODO: i18n
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });

    if (authError) {
      setLoading(false);
      setError(mapAuthError(authError.message));
      return;
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', data.user.id);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerClassName="grow justify-center py-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="brand" className="text-center mb-2">
            nura
          </Text>
          <Text variant="display" className="text-center mb-8">
            Créer un compte{/* TODO: i18n */}
          </Text>

          <View className="gap-4 mb-2">
            <Input
              placeholder="Ton prénom" // TODO: i18n
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
            <Input
              placeholder="Email" // TODO: i18n
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Input
              placeholder="Mot de passe" // TODO: i18n
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
          </View>

          <Text variant="caption" className="text-foreground-muted dark:text-dark-foreground-muted mb-6">
            Minimum 6 caractères{/* TODO: i18n */}
          </Text>

          {error ? (
            <Text variant="caption" className="text-status-error text-center mb-4">
              {error}
            </Text>
          ) : null}

          <Button
            variant="primary"
            label="S'inscrire" // TODO: i18n
            loading={loading}
            onPress={handleSignup}
            className="mb-8"
          />

          <Pressable onPress={() => router.back()}>
            <Text variant="body" className="text-center">
              <Text variant="body" className="text-foreground-muted dark:text-dark-foreground-muted">
                Déjà un compte ?{' '}
              </Text>
              <Text variant="body" className="text-accent font-sans-semibold">
                Se connecter{/* TODO: i18n */}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
