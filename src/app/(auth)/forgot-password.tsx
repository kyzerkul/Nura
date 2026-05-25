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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setError('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Adresse email invalide'); // TODO: i18n
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
    );
    setLoading(false);

    if (resetError) {
      setError(mapAuthError(resetError.message));
      return;
    }

    setSent(true);
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
          <Pressable onPress={() => router.back()}>
            <Text variant="body" className="text-accent-blue mb-6">
              ← Retour{/* TODO: i18n */}
            </Text>
          </Pressable>

          <Text variant="brand" className="text-center mb-2">
            nura
          </Text>
          <Text variant="display" className="text-center mb-4">
            Réinitialiser le mot de passe{/* TODO: i18n */}
          </Text>

          {sent ? (
            <View className="items-center gap-4">
              <Text variant="body" className="text-center text-foreground-secondary dark:text-dark-foreground-secondary">
                Un lien de réinitialisation a été envoyé à{' '}
                <Text variant="body" className="font-sans-semibold">
                  {email}
                </Text>
                . Vérifie ta boîte de réception.{/* TODO: i18n */}
              </Text>
              <Button
                variant="secondary"
                label="Retour à la connexion" // TODO: i18n
                onPress={() => router.back()}
              />
            </View>
          ) : (
            <>
              <Text variant="body" className="text-foreground-muted dark:text-dark-foreground-muted text-center mb-8">
                Entre ton email, on t&apos;enverra un lien.{/* TODO: i18n */}
              </Text>

              <Input
                placeholder="Email" // TODO: i18n
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                className="mb-4"
              />

              {error ? (
                <Text variant="caption" className="text-status-error text-center mb-4">
                  {error}
                </Text>
              ) : null}

              <Button
                variant="primary"
                label="Envoyer le lien" // TODO: i18n
                loading={loading}
                onPress={handleReset}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
