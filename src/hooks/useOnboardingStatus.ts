import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useSession';

export function useOnboardingStatus() {
  const { session } = useSession();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const checkOnboarding = async () => {
      const { data } = await supabase
        .from('companions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .limit(1);

      setNeedsOnboarding(!data || data.length === 0);
      setIsLoading(false);
    };

    checkOnboarding();
  }, [session?.user?.id]);

  return { needsOnboarding, isLoading };
}
