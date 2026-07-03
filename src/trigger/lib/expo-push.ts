export type ExpoPushMessage = {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: { url: string };
};

export type ExpoPushTicket = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

/**
 * Sends push messages via the Expo Push API. Tickets are returned in the
 * same order as the messages, so callers can map failures back to tokens.
 */
export async function sendExpoPush(
  messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push error: ${response.status}`);
  }

  const data = (await response.json()) as { data?: ExpoPushTicket[] };
  return data.data ?? [];
}
