import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useSession';

export function useOnboardingStatus() {
  const { session, signOut } = useSession();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setNeedsOnboarding(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkOnboarding = async () => {
      setIsLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .limit(1)
        .single();

      if (cancelled) return;

      if (!profile) {
        await signOut();
        return;
      }

      const { data, error } = await supabase
        .from('companions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (cancelled) return;

      if (error) {
        setNeedsOnboarding(false);
      } else {
        setNeedsOnboarding(!data || data.length === 0);
      }
      setIsLoading(false);
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, signOut]);

  return { needsOnboarding, isLoading };
}
