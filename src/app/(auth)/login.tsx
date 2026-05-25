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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Adresse email invalide'); // TODO: i18n
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères'); // TODO: i18n
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError(mapAuthError(authError.message));
    }
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
            Bon retour{/* TODO: i18n */}
          </Text>

          <View className="gap-4 mb-6">
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
              autoComplete="password"
              textContentType="password"
            />
          </View>

          {error ? (
            <Text variant="caption" className="text-status-error text-center mb-4">
              {error}
            </Text>
          ) : null}

          <Button
            variant="primary"
            label="Se connecter" // TODO: i18n
            loading={loading}
            onPress={handleLogin}
            className="mb-4"
          />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text variant="caption" className="text-accent-blue text-center mb-6">
              Mot de passe oublié ?{/* TODO: i18n */}
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-4 mb-6">
            <View className="flex-1 h-px bg-border dark:bg-dark-background-elevated" />
            <Text variant="caption" className="text-foreground-muted dark:text-dark-foreground-muted">
              ou{/* TODO: i18n */}
            </Text>
            <View className="flex-1 h-px bg-border dark:bg-dark-background-elevated" />
          </View>

          <Button
            variant="secondary"
            label="Connexion par téléphone" // TODO: i18n
            onPress={() => router.push('/(auth)/verify-otp')}
            className="mb-8"
          />

          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text variant="body" className="text-center">
              <Text variant="body" className="text-foreground-muted dark:text-dark-foreground-muted">
                Pas encore de compte ?{' '}
              </Text>
              <Text variant="body" className="text-accent font-sans-semibold">
                S&apos;inscrire{/* TODO: i18n */}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
