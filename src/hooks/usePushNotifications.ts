import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useSession } from '@/hooks/useSession';
import { registerForPushNotifications } from '@/lib/notifications';

/**
 * Registers the device for push notifications once per app session and
 * navigates to the chat when the user taps a notification (covers both
 * background taps and cold starts).
 */
export function usePushNotifications(): void {
  const { session } = useSession();
  const router = useRouter();
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!session || hasRegistered.current) return;
    hasRegistered.current = true;
    void registerForPushNotifications(session.user.id);
  }, [session]);

  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!lastResponse) return;
    router.navigate('/(tabs)/chat');
  }, [lastResponse, router]);
}
