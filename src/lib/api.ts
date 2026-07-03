import { fetch as expoFetch } from 'expo/fetch';

import { supabase } from '@/lib/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

type StreamEvent = {
  token?: string;
  done?: boolean;
  error?: string;
};

type StreamChatOptions = {
  conversationId: string;
  onToken: (token: string) => void;
  signal?: AbortSignal;
};

/**
 * Calls the `chat` Edge Function and streams the AI reply token by token.
 * Resolves when the server confirms the assistant message was persisted;
 * throws on any transport or server error.
 */
export async function streamChatReply({
  conversationId,
  onToken,
  signal,
}: StreamChatOptions): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // RN's global fetch cannot stream response bodies — expo/fetch can.
  const response = await expoFetch(`${supabaseUrl}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({ conversation_id: conversationId }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error('Chat request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const rawEvent of events) {
        const line = rawEvent.trim();
        if (!line.startsWith('data: ')) continue;

        let event: StreamEvent;
        try {
          event = JSON.parse(line.slice(6)) as StreamEvent;
        } catch {
          continue;
        }

        if (typeof event.error === 'string') {
          throw new Error('Chat stream failed');
        }
        if (event.done === true) {
          completed = true;
        }
        if (typeof event.token === 'string' && event.token.length > 0) {
          onToken(event.token);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!completed) {
    throw new Error('Chat stream ended unexpectedly');
  }
}
