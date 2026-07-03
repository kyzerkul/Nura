import { logger, schedules } from '@trigger.dev/sdk';

import type { Profile } from '../types/database';
import { sendExpoPush, type ExpoPushMessage } from './lib/expo-push';
import { generateCompletion, type ChatMessage } from './lib/openrouter';
import { createAdminClient, type AdminClient } from './lib/supabase-admin';

const MAX_USERS_PER_RUN = 50;
const QUIET_HOUR_START = 21; // no push from 21:00…
const QUIET_HOUR_END = 9; // …to 09:00 local time
const MIN_INACTIVITY_HOURS = 3; // never interrupt an active conversation
const RENOTIFY_AFTER_HOURS = 168; // one nudge after 7 days without a reply
const CONTEXT_MESSAGE_LIMIT = 10;
const GENERATION_MAX_TOKENS = 200;
const PUSH_BODY_MAX_LENGTH = 178;
const HOUR_MS = 3_600_000;

const FREQUENCY_HOURS: Record<Profile['notification_frequency'], number | null> = {
  off: null,
  daily: 20,
  twice_daily: 8,
  weekly: 144,
};

type DueProfile = Pick<
  Profile,
  | 'id'
  | 'display_name'
  | 'language'
  | 'notification_frequency'
  | 'timezone'
  | 'last_proactive_at'
>;

type UserToken = { id: string; token: string };

function localHour(timezone: string | null, date: Date): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? 'UTC',
      hour: 'numeric',
      hour12: false,
    }).format(date);
    const hour = Number.parseInt(formatted, 10);
    return Number.isNaN(hour) ? date.getUTCHours() : hour % 24;
  } catch {
    return date.getUTCHours();
  }
}

function isDue(profile: DueProfile, now: Date): boolean {
  const thresholdHours = FREQUENCY_HOURS[profile.notification_frequency];
  if (thresholdHours === null) return false;

  if (profile.last_proactive_at) {
    const hoursSince =
      (now.getTime() - new Date(profile.last_proactive_at).getTime()) / HOUR_MS;
    if (hoursSince < thresholdHours) return false;
  }

  const hour = localHour(profile.timezone, now);
  return hour >= QUIET_HOUR_END && hour < QUIET_HOUR_START;
}

function buildSystemPrompt(opts: {
  persona: string;
  language: string;
  displayName: string | null;
  summary: string | null;
}): string {
  const languageLine =
    opts.language === 'en'
      ? 'Always reply in English.'
      : 'Réponds toujours en français.';

  const task = [
    'Tu envoies spontanément un petit message pour prendre des nouvelles de l\'utilisatrice, en te basant sur les derniers échanges.',
    '1 à 3 phrases maximum, chaleureux et naturel, en restant dans ton personnage.',
    'Une seule question maximum. Ne commence pas par "Bonjour" si la conversation est déjà engagée.',
    'Réponds uniquement avec le message, rien d\'autre — pas de guillemets, pas de préambule.',
  ].join('\n');

  const guardrails = [
    'Limites strictes :',
    '- Tu es une amie et confidente, jamais une partenaire romantique. Aucun contenu romantique, séducteur ou sexuel.',
    '- Si les derniers échanges évoquent une détresse grave, réponds avec chaleur et encourage doucement à en parler à un professionnel de santé ou à une personne de confiance. Ne pose jamais de diagnostic.',
  ].join('\n');

  const parts = [opts.persona, languageLine, task, guardrails];
  if (opts.displayName) {
    parts.push(`L'utilisatrice s'appelle ${opts.displayName}.`);
  }
  if (opts.summary) {
    parts.push(`Résumé de la conversation jusqu'ici : ${opts.summary}`);
  }
  return parts.join('\n\n');
}

function toPushBody(content: string): string {
  const singleLine = content.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= PUSH_BODY_MAX_LENGTH) return singleLine;
  return `${singleLine.slice(0, PUSH_BODY_MAX_LENGTH - 1)}…`;
}

async function pruneDeadTokens(
  supabase: AdminClient,
  userTokens: UserToken[],
  tickets: Awaited<ReturnType<typeof sendExpoPush>>,
): Promise<void> {
  const deadIds = userTokens
    .filter((_, i) => tickets[i]?.details?.error === 'DeviceNotRegistered')
    .map((t) => t.id);
  if (deadIds.length === 0) return;

  const { error } = await supabase.from('push_tokens').delete().in('id', deadIds);
  if (error) {
    logger.warn('Failed to prune dead push tokens', { count: deadIds.length });
  }
}

/** Returns true when a check-in was generated and recorded for this user. */
async function processUser(
  supabase: AdminClient,
  profile: DueProfile,
  userTokens: UserToken[],
  now: Date,
): Promise<boolean> {
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, companion_id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (conversationError) throw new Error('Failed to load conversation');
  if (!conversation) return false;

  const [companionResult, summaryResult, messagesResult] = await Promise.all([
    supabase
      .from('companions')
      .select('name, persona')
      .eq('id', conversation.companion_id)
      .maybeSingle(),
    supabase
      .from('conversation_summaries')
      .select('summary')
      .eq('conversation_id', conversation.id)
      .maybeSingle(),
    supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(CONTEXT_MESSAGE_LIMIT),
  ]);
  if (companionResult.error || summaryResult.error || messagesResult.error) {
    throw new Error('Failed to load conversation context');
  }
  if (!companionResult.data) return false;
  const companion = companionResult.data;

  const recentMessages = (messagesResult.data ?? []).reverse();
  const lastUserMessage = [...recentMessages]
    .reverse()
    .find((m) => m.role === 'user');

  // Nothing to follow up on until she has written at least once.
  if (!lastUserMessage) return false;

  const hoursSinceUserMessage =
    (now.getTime() - new Date(lastUserMessage.created_at).getTime()) / HOUR_MS;
  if (hoursSinceUserMessage < MIN_INACTIVITY_HOURS) return false;

  // Reply-gating: wait for her answer to the previous check-in,
  // with a single re-engagement nudge allowed after 7 days.
  if (profile.last_proactive_at) {
    const lastProactive = new Date(profile.last_proactive_at);
    const hasRepliedSince = new Date(lastUserMessage.created_at) > lastProactive;
    const hoursSinceProactive = (now.getTime() - lastProactive.getTime()) / HOUR_MS;
    if (!hasRepliedSince && hoursSinceProactive < RENOTIFY_AFTER_HOURS) {
      return false;
    }
  }

  const systemPrompt = buildSystemPrompt({
    persona: companion.persona,
    language: profile.language,
    displayName: profile.display_name,
    summary: summaryResult.data?.summary ?? null,
  });

  const transcript = recentMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `[${m.role === 'user' ? 'utilisatrice' : 'toi'}] ${m.content}`)
    .join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Derniers échanges :\n${transcript}\n\nGénère uniquement le message de prise de nouvelles.`,
    },
  ];

  const content = await generateCompletion(messages, GENERATION_MAX_TOKENS);
  if (content.length === 0) return false;

  // The message is the source of truth — persisted before any push attempt,
  // so a delivery failure never loses the check-in.
  const { error: insertError } = await supabase.from('messages').insert({
    conversation_id: conversation.id,
    role: 'assistant',
    content,
  });
  if (insertError) throw new Error('Failed to insert check-in message');

  try {
    const pushMessages: ExpoPushMessage[] = userTokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: companion.name,
      body: toPushBody(content),
      data: { url: '/chat' },
    }));
    const tickets = await sendExpoPush(pushMessages);
    await pruneDeadTokens(supabase, userTokens, tickets);
  } catch {
    // Message already persisted and visible in-app; push retried implicitly
    // at the next eligible check-in.
    logger.warn('Push delivery failed', { userId: profile.id });
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ last_proactive_at: now.toISOString() })
    .eq('id', profile.id);
  if (updateError) {
    logger.warn('Failed to update last_proactive_at', { userId: profile.id });
  }

  return true;
}

export const proactiveCheckin = schedules.task({
  id: 'proactive-checkin',
  cron: '0 * * * *',
  maxDuration: 300,
  run: async () => {
    const supabase = createAdminClient();
    const now = new Date();

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(
        'id, display_name, language, notification_frequency, timezone, last_proactive_at',
      )
      .neq('notification_frequency', 'off');
    if (profilesError) throw new Error('Failed to load profiles');

    const due = (profiles ?? [])
      .filter((p) => isDue(p, now))
      .slice(0, MAX_USERS_PER_RUN);
    if (due.length === 0) {
      logger.info('No users due for a check-in');
      return { due: 0, sent: 0 };
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('id, user_id, token')
      .in(
        'user_id',
        due.map((p) => p.id),
      );
    if (tokensError) throw new Error('Failed to load push tokens');

    const tokensByUser = new Map<string, UserToken[]>();
    for (const t of tokens ?? []) {
      const list = tokensByUser.get(t.user_id) ?? [];
      list.push({ id: t.id, token: t.token });
      tokensByUser.set(t.user_id, list);
    }

    let sent = 0;
    for (const profile of due) {
      const userTokens = tokensByUser.get(profile.id);
      // No deliverable device → skip, otherwise check-ins pile up unseen.
      if (!userTokens || userTokens.length === 0) continue;

      try {
        if (await processUser(supabase, profile, userTokens, now)) {
          sent += 1;
        }
      } catch (err) {
        // Never log message content — ids and error names only.
        logger.error('Check-in failed for user', {
          userId: profile.id,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }

    logger.info('Proactive check-in run complete', { due: due.length, sent });
    return { due: due.length, sent };
  },
});
