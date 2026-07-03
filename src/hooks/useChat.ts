import { useCallback, useEffect, useRef, useState } from 'react';

import { streamChatReply } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/types/database';

const PAGE_SIZE = 30;
const MAX_MESSAGE_LENGTH = 2000;

export type ChatError = 'load' | 'send' | 'reply' | null;

type UseChatResult = {
  messages: Message[];
  streamingText: string | null;
  isStreaming: boolean;
  isLoading: boolean;
  isLoadingOlder: boolean;
  hasMore: boolean;
  error: ChatError;
  send: (text: string) => Promise<void>;
  loadOlder: () => Promise<void>;
  retry: () => Promise<void>;
};

/**
 * Chat state for a conversation: paginated history (newest first, for an
 * inverted list), optimistic sends, and the streaming AI reply lifecycle.
 */
export function useChat(conversationId: string | null): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<ChatError>(null);

  const abortRef = useRef<AbortController | null>(null);
  const replyRef = useRef('');

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      if (!conversationId) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data, error: loadError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (cancelled) return;

      if (loadError) {
        setError('load');
      } else {
        setMessages(data ?? []);
        setHasMore((data ?? []).length === PAGE_SIZE);
      }
      setIsLoading(false);
    };

    loadInitial();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [conversationId]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || isLoadingOlder || !hasMore) return;

    const oldest = messages[messages.length - 1];
    if (!oldest) return;

    setIsLoadingOlder(true);

    const { data, error: loadError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (!loadError && data) {
      setMessages((current) => [...current, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setIsLoadingOlder(false);
  }, [conversationId, isLoadingOlder, hasMore, messages]);

  const startStream = useCallback(async () => {
    if (!conversationId) return;

    const controller = new AbortController();
    abortRef.current = controller;
    replyRef.current = '';
    setError(null);
    setIsStreaming(true);
    setStreamingText('');

    try {
      await streamChatReply({
        conversationId,
        signal: controller.signal,
        onToken: (token) => {
          replyRef.current += token;
          setStreamingText(replyRef.current);
        },
      });

      // Server persisted the reply; mirror it locally without a refetch.
      const assistantMessage: Message = {
        id: `local-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: replyRef.current,
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [assistantMessage, ...current]);
    } catch {
      if (!controller.signal.aborted) {
        setError('reply');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsStreaming(false);
        setStreamingText(null);
      }
    }
  }, [conversationId]);

  const send = useCallback(
    async (text: string) => {
      if (!conversationId || isStreaming) return;

      const content = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!content) return;

      setError(null);

      const optimistic: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [optimistic, ...current]);

      const { data: saved, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content,
        })
        .select()
        .single();

      if (insertError || !saved) {
        setMessages((current) => current.filter((m) => m.id !== optimistic.id));
        setError('send');
        return;
      }

      setMessages((current) =>
        current.map((m) => (m.id === optimistic.id ? saved : m)),
      );

      await startStream();
    },
    [conversationId, isStreaming, startStream],
  );

  const retry = useCallback(async () => {
    if (isStreaming) return;
    // The user message is already persisted — only the AI reply is retried.
    if (messages[0]?.role === 'user') {
      await startStream();
    } else {
      setError(null);
    }
  }, [isStreaming, messages, startStream]);

  return {
    messages,
    streamingText,
    isStreaming,
    isLoading,
    isLoadingOlder,
    hasMore,
    error,
    send,
    loadOlder,
    retry,
  };
}
