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

type Step = 'phone' | 'code';

export default function VerifyOtpScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
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

  const validatePhone = (value: string) => {
    return value.startsWith('+') && value.replace(/\D/g, '').length >= 10;
  };

  const handleSendCode = async () => {
    setError('');

    if (!validatePhone(phone)) {
      setError('Numéro de téléphone invalide'); // TODO: i18n
      return;
    }

    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });
    setLoading(false);

    if (otpError) {
      setError(mapAuthError(otpError.message));
      return;
    }

    setStep('code');
    startCooldown();
  };

  const handleVerifyCode = async () => {
    setError('');

    if (!/^\d{6}$/.test(code)) {
      setError('Le code doit contenir 6 chiffres'); // TODO: i18n
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: code,
      type: 'sms',
    });
    setLoading(false);

    if (verifyError) {
      setError(mapAuthError(verifyError.message));
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    const { error: resendError } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });
    setLoading(false);
    if (resendError) {
      setError(mapAuthError(resendError.message));
      return;
    }
    startCooldown();
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
          <Pressable onPress={() => (step === 'code' ? setStep('phone') : router.back())}>
            <Text variant="body" className="text-accent-blue mb-6">
              ← Retour{/* TODO: i18n */}
            </Text>
          </Pressable>

          <Text variant="brand" className="text-center mb-2">
            nura
          </Text>

          {step === 'phone' ? (
            <>
              <Text variant="display" className="text-center mb-4">
                Connexion par téléphone{/* TODO: i18n */}
              </Text>
              <Text variant="body" className="text-foreground-muted dark:text-dark-foreground-muted text-center mb-8">
                Entre ton numéro avec l&apos;indicatif pays (+33, +225...){/* TODO: i18n */}
              </Text>

              <Input
                placeholder="+33 6 12 34 56 78" // TODO: i18n
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                className="mb-4"
              />

              {error ? (
                <Text variant="caption" className="text-status-error text-center mb-4">
                  {error}
                </Text>
              ) : null}

              <Button
                variant="primary"
                label="Envoyer le code" // TODO: i18n
                loading={loading}
                onPress={handleSendCode}
              />
            </>
          ) : (
            <>
              <Text variant="display" className="text-center mb-4">
                Vérification{/* TODO: i18n */}
              </Text>
              <Text variant="body" className="text-foreground-muted dark:text-dark-foreground-muted text-center mb-8">
                Entre le code à 6 chiffres envoyé au {phone}{/* TODO: i18n */}
              </Text>

              <Input
                placeholder="000000" // TODO: i18n
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
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
                onPress={handleVerifyCode}
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
