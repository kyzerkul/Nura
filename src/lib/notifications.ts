import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { lightColors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const DEVICE_ID_KEY = 'nura_device_id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

async function syncTimezone(userId: string): Promise<void> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timezone) return;

  const { data } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();
  if (!data || data.timezone === timezone) return;

  await supabase.from('profiles').update({ timezone }).eq('id', userId);
}

/**
 * Registers this device for proactive push notifications.
 * Every step fails soft: registration is retried on the next app session
 * and must never block or crash the UI.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) return;

    // Remote push was removed from Expo Go on Android (SDK 53+) —
    // requires a development build.
    if (
      Platform.OS === 'android' &&
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ) {
      return;
    }

    // getExpoPushTokenAsync requires an EAS project (added by `eas init`).
    const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId;
    if (typeof projectId !== 'string' || projectId.length === 0) return;

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted && current.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Nura',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: lightColors.accent.primary,
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const deviceId = await getOrCreateDeviceId();

    await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, device_id: deviceId },
        { onConflict: 'user_id,device_id' },
      );

    await syncTimezone(userId);
  } catch {
    // Fail soft — no permission, no EAS project, or transient network error.
  }
}
