import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestionChips } from '@/components/chat/SuggestionChips';
import { TypingDots } from '@/components/chat/TypingDots';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { tChat } from '@/constants/chat-i18n';
import { getColors } from '@/constants/colors';
import { useChat } from '@/hooks/useChat';
import { useConversation } from '@/hooks/useConversation';
import type { Message } from '@/types/database';

export default function ChatScreen() {
  const { conversation, companion, language, isLoading, hasError, reload } =
    useConversation();
  const chat = useChat(conversation?.id ?? null);
  const t = tChat(language);
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark' ? 'dark' : 'light');

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.role === 'system') return null;
    return <ChatBubble role={item.role} content={item.content} />;
  };

  const streamingHeader = chat.isStreaming ? (
    chat.streamingText ? (
      <ChatBubble role="assistant" content={chat.streamingText} animate={false} />
    ) : (
      <View className="flex-row justify-start px-4 py-1">
        <View className="bg-companion-bubble dark:bg-dark-background-card border border-border-subtle dark:border-dark-background-elevated rounded-bubble px-3 py-3">
          <TypingDots />
        </View>
      </View>
    )
  ) : null;

  const errorBanner = chat.error ? (
    <View className="flex-row items-center justify-between gap-2 mx-4 my-1 px-3 py-2 bg-background-card dark:bg-dark-background-card border border-border rounded-input">
      <Text variant="caption" className="flex-1">
        {chat.error === 'send'
          ? t.errors.sendFailed
          : chat.error === 'reply'
            ? t.errors.replyFailed
            : t.errors.loadFailed}
      </Text>
      {chat.error === 'reply' ? (
        <Pressable accessibilityRole="button" onPress={chat.retry}>
          <Text variant="caption" className="text-accent font-sans-semibold">
            {t.errors.retry}
          </Text>
        </Pressable>
      ) : null}
    </View>
  ) : null;

  let content;
  if (isLoading || (conversation && chat.isLoading)) {
    content = (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.accent.primary} />
      </View>
    );
  } else if (hasError) {
    content = (
      <View className="flex-1 items-center justify-center px-4 gap-3">
        <Text variant="body" className="text-center">
          {t.errors.loadFailed}
        </Text>
        <Pressable accessibilityRole="button" onPress={reload}>
          <Text variant="body" className="text-accent font-sans-semibold">
            {t.errors.retry}
          </Text>
        </Pressable>
      </View>
    );
  } else if (!companion || !conversation) {
    content = (
      <View className="flex-1 items-center justify-center px-4">
        <Text
          variant="body"
          className="text-foreground-muted dark:text-dark-foreground-muted text-center"
        >
          {t.empty.noCompanion}
        </Text>
      </View>
    );
  } else {
    content = (
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          inverted
          data={chat.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListHeaderComponent={streamingHeader}
          ListFooterComponent={
            chat.isLoadingOlder ? (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color={colors.accent.primary} />
              </View>
            ) : null
          }
          onEndReached={chat.loadOlder}
          onEndReachedThreshold={0.3}
          contentContainerClassName="py-2"
        />
        {errorBanner}
        {chat.messages.length <= 1 && !chat.isStreaming ? (
          <SuggestionChips
            suggestions={t.suggestions}
            disabled={chat.isStreaming}
            onSelect={chat.send}
          />
        ) : null}
        <ChatInput
          placeholder={t.input.placeholder}
          sendLabel={t.input.sendLabel}
          disabled={chat.isStreaming || chat.error === 'load'}
          onSend={chat.send}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1 bg-background dark:bg-dark-background"
    >
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border-subtle dark:border-dark-background-elevated">
        <Avatar
          type="companion"
          label={companion ? companion.name.charAt(0).toLowerCase() : 'n'}
          size="md"
        />
        <View>
          <Text variant="subheading" className="font-sans-semibold">
            {companion?.name ?? 'nura'}
          </Text>
          <Text variant="caption">{t.header.subtitle}</Text>
        </View>
      </View>
      {content}
    </SafeAreaView>
  );
}
