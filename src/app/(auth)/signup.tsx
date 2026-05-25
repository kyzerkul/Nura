import { useEffect, useRef, useState } from 'react';
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

type Step = 'form' | 'verify';

export default function SignupScreen() {
  const [step, setStep] = useState<Step>('form');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: displayName.trim() } },
      });

      if (authError) {
        setError(mapAuthError(authError.message));
        return;
      }

      setStep('verify');
      startCooldown();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');

    if (!/^\d{6,8}$/.test(code)) {
      setError('Code invalide'); // TODO: i18n
      return;
    }

    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'signup',
      });

      if (verifyError) {
        setError(mapAuthError(verifyError.message));
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', data.user.id);

        if (profileError) {
          setError(mapAuthError(profileError.message));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (resendError) {
        setError(mapAuthError(resendError.message));
        return;
      }
      startCooldown();
    } finally {
      setLoading(false);
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

          {step === 'form' ? (
            <>
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
            </>
          ) : (
            <>
              <Text variant="display" className="text-center mb-4">
                Vérifie ton email{/* TODO: i18n */}
              </Text>
              <Text variant="body" className="text-foreground-muted dark:text-dark-foreground-muted text-center mb-8">
                Entre le code à 6 chiffres envoyé à {email}{/* TODO: i18n */}
              </Text>

              <Input
                placeholder="000000"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={8}
                textContentType="oneTimeCode"
                className="mb-4 text-center text-heading font-sans-semibold tracking-widest"
              />

              {error ? (
                <Text variant="caption" className="text-status-error text-center mb-4">
                  {error}
                </Text>
              ) : null}

              <Button
                variant="primary"
                label="Vérifier" // TODO: i18n
                loading={loading}
                onPress={handleVerify}
                className="mb-4"
              />

              <Pressable onPress={handleResend} disabled={cooldown > 0 || loading}>
                <Text
                  variant="caption"
                  className={`text-center ${cooldown > 0 || loading ? 'text-foreground-muted dark:text-dark-foreground-muted' : 'text-accent-blue'}`}
                >
                  {cooldown > 0
                    ? `Renvoyer le code (${cooldown}s)` // TODO: i18n
                    : 'Renvoyer le code' /* TODO: i18n */}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
