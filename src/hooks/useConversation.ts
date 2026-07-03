import { useCallback, useEffect, useState } from 'react';

import { COMPANION_PRESETS } from '@/constants/companions';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';
import type { Companion, Conversation } from '@/types/database';

type UseConversationResult = {
  conversation: Conversation | null;
  companion: Companion | null;
  language: 'fr' | 'en';
  isLoading: boolean;
  hasError: boolean;
  reload: () => void;
};

/**
 * Loads (or creates) the user's single continuous conversation with her
 * active companion. On first creation, inserts the companion's static
 * greeting so the chat never opens empty.
 */
export function useConversation(): UseConversationResult {
  const { session } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        setConversation(null);
        setCompanion(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      const [companionResult, profileResult] = await Promise.all([
        supabase
          .from('companions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('language')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (companionResult.error || profileResult.error) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const activeCompanion = companionResult.data;
      const profileLanguage: 'fr' | 'en' =
        profileResult.data?.language === 'en' ? 'en' : 'fr';
      setLanguage(profileLanguage);

      if (!activeCompanion) {
        // Root routing sends companion-less users to onboarding;
        // the chat screen shows a friendly empty state meanwhile.
        setCompanion(null);
        setConversation(null);
        setIsLoading(false);
        return;
      }
      setCompanion(activeCompanion);

      const { data: existing, error: existingError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (existingError) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      if (existing) {
        setConversation(existing);
        setIsLoading(false);
        return;
      }

      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({ user_id: userId, companion_id: activeCompanion.id, title: null })
        .select()
        .single();

      if (cancelled) return;

      if (createError || !created) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const preset =
        COMPANION_PRESETS.find((p) => p.name === activeCompanion.name) ??
        COMPANION_PRESETS[0];

      const { error: greetingError } = await supabase.from('messages').insert({
        conversation_id: created.id,
        role: 'assistant',
        content: preset.firstMessage[profileLanguage],
      });

      if (cancelled) return;

      if (greetingError) {
        // Conversation exists but greeting failed — usable, just starts empty.
        setConversation(created);
        setIsLoading(false);
        return;
      }

      setConversation(created);
      setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, reloadCount]);

  return { conversation, companion, language, isLoading, hasError, reload };
}
