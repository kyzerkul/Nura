# Feature Spec: 05 — Chat & AI Integration

> **Phase**: 2 (Build)
> **Status**: in_progress
> **Depends on**: `04_onboarding` complete

---

## Goal

The user can talk to her companion in a single continuous conversation thread. Messages are persisted in Supabase, AI replies stream in token by token via the `chat` Edge Function (OpenRouter → DeepSeek V4, fallback Minimax M2.5), and the conversation history loads with pagination.

After this unit, the core product loop works end-to-end: open app → chat tab → send message → streaming AI reply, with full history on reopen.

**Product decisions (confirmed by founder, 2026-07-03):**
- **Single continuous thread** — one permanent conversation per user with her active companion (WhatsApp-style, not ChatGPT-style multi-conversation)
- **Token-by-token streaming** — Edge Function relays OpenRouter's SSE stream; client renders progressively via `expo/fetch`

---

## Scope

### In scope

1. Rewrite `supabase/functions/chat/index.ts`: context building server-side + SSE streaming relay
2. Get-or-create conversation logic (single thread per user)
3. Static first greeting from the companion when the conversation is created (per persona, per language)
4. Chat screen (`(tabs)/chat.tsx`): header with companion avatar/name, inverted message list, input bar
5. Message persistence: user message saved before AI call; assistant message saved server-side after stream completes
6. Context window: system prompt (persona + language + guardrails) + conversation summary (if present) + last 20 messages
7. Pagination: latest 30 messages on open, older messages load on scroll up
8. Typing indicator (3 animated dots) while waiting for first token
9. Suggestion chips (static conversation starters) shown when the conversation is nearly empty
10. Keyboard avoidance, error states, retry on failure
11. Bilingual UI strings via `chat-i18n.ts` (same pattern as `onboarding-i18n.ts`)

### Out of scope

- Conversation summary **generation** (background job → spec 06 with Trigger.dev; here we only *read* the summary if one exists)
- Proactive notifications (spec 06)
- PostHog analytics events (PostHog is not installed yet — deferred to a later spec, noted in Future considerations)
- Voice messages, images, attachments
- Inline action cards (rituel, respiration — journal/rituals features, later phase)
- Editing or deleting individual messages
- Multiple conversations / conversation list
- Changing companion (spec 07)

---

## Architecture — request flow

```text
[Chat screen]
  1. useConversation(): get-or-create the single conversation
     (+ insert static companion greeting on first creation)
  2. User types → INSERT user message into `messages` (RLS, client-side)
  3. Client calls Edge Function /chat via expo/fetch (SSE):
       POST { conversation_id }  +  Authorization: Bearer <access_token>

[Edge Function chat] (user-scoped client — anon key + user JWT, RLS enforced)
  4. Verify JWT → load conversation (404 if not owned)
  5. Load: companion (persona, name), profile (language), summary (if any),
     last 20 messages (chronological)
  6. Build system prompt: persona + language instruction + safety guardrails
  7. Call OpenRouter with stream: true + models fallback array
  8. Relay normalized SSE to client:  data: {"token":"..."}
     while accumulating the full reply text
  9. On [DONE]: INSERT assistant message into `messages`,
     then emit  data: {"done":true}

[Chat screen]
 10. Renders tokens progressively in a streaming bubble
 11. On done: streaming bubble becomes a normal persisted message
```

**Why the client sends only `conversation_id`** (not the message array): the server rebuilds context from the DB — single source of truth, no client-side prompt tampering, smaller payloads, and the context budget is enforced in exactly one place.

**Why the assistant message is saved server-side**: if the app is killed mid-stream, the reply still lands in the DB and appears on next open. The client's streamed text is display-only.

---

## Files to create or modify

| Action | File | Purpose |
|---|---|---|
| **Rewrite** | `supabase/functions/chat/index.ts` | Context building + streaming SSE relay + assistant message persistence |
| **Modify** | `src/constants/companions.ts` | Add `firstMessage: { fr, en }` to each preset (static greeting) |
| **Create** | `src/constants/chat-i18n.ts` | Bilingual UI strings for the chat screen |
| **Create** | `src/lib/api.ts` | `streamChatReply()` — SSE call to the Edge Function via `expo/fetch` |
| **Create** | `src/hooks/useConversation.ts` | Get-or-create conversation + companion + language |
| **Create** | `src/hooks/useChat.ts` | Messages state, pagination, send flow, streaming state |
| **Create** | `src/components/chat/ChatBubble.tsx` | Companion / user message bubbles |
| **Create** | `src/components/chat/TypingDots.tsx` | Animated 3-dot typing indicator |
| **Create** | `src/components/chat/ChatInput.tsx` | Input bar: text field + send button |
| **Create** | `src/components/chat/SuggestionChips.tsx` | Static conversation-starter chips |
| **Rewrite** | `src/app/(tabs)/chat.tsx` | Full chat screen |

No DB migration needed — `conversations`, `messages`, `conversation_summaries` and their RLS policies already exist (migration 001).

---

## Implementation details

### 1. Edge Function (`supabase/functions/chat/index.ts`)

**Input**: `POST { conversation_id: string }` (validate: present, UUID format → else 400)

**Auth**: same pattern as current scaffold — anon-key client with the caller's `Authorization` header; `supabase.auth.getUser()` must succeed (else 401). All DB reads/writes go through this user-scoped client, so RLS guarantees ownership.

**Context building** (in order):
1. `conversations` — select by id → 404 if not found (RLS filters foreign rows)
2. `companions` — select persona, name by `conversation.companion_id`
3. `profiles` — select language
4. `conversation_summaries` — `maybeSingle()` by conversation_id (may not exist)
5. `messages` — last 20, `order('created_at', desc).limit(20)`, then reverse to chronological; map to `{ role, content }`, excluding `system` rows

**System prompt** (server-side only, built from):
- The companion `persona` text (from DB)
- Language instruction: reply in French / English per `profile.language`
- Style: warm, concise (2–4 short paragraphs max), asks gentle follow-up questions, remembers context
- Guardrails (v1 scope): no romantic or sexual content — the companion is a friend/confidante; if the user expresses serious distress or self-harm intent, respond with warmth and encourage reaching out to a professional or trusted person (no diagnosis)
- Summary block appended if a summary exists: "Résumé de la conversation jusqu'ici: …"

**OpenRouter call**:
```jsonc
{
  "models": ["deepseek/deepseek-v4-flash:free", "minimax/minimax-m2.5:free"],
  "route": "fallback",           // invariant — never a single model
  "stream": true,
  "max_tokens": 1024,
  "messages": [system, ...last20]
}
```

**Streaming relay** — normalize OpenRouter's SSE into our own minimal protocol (`Content-Type: text/event-stream`):
- Parse upstream `data:` lines; for each non-empty `choices[0].delta.content`, emit `data: {"token":"<chunk>"}\n\n` and append to an accumulator
- On upstream `[DONE]` (or stream end): if accumulated text is non-empty, `INSERT` the assistant message (`{ conversation_id, role: 'assistant', content }`) via the user-scoped client, then emit `data: {"done":true}\n\n` (or `data: {"error":"save_failed"}\n\n` if the insert fails)
- On upstream/OpenRouter failure before any token: return JSON 502 `{ error: 'AI service unavailable' }` (not a stream)
- Never log message content — log only status codes / lengths (existing convention)

### 2. Companion greetings (`src/constants/companions.ts`)

Add to `CompanionPreset`:
```ts
firstMessage: { fr: string; en: string };
```
One warm opening line per persona (in character), e.g. Nura (fr): « Coucou, je suis Nura 🤗 Je suis là pour toi, à ton rythme. Raconte-moi… comment tu te sens aujourd'hui ? » — equivalents for Amina (energetic) and Seren (calm), plus English versions.

### 3. `useConversation` hook (`src/hooks/useConversation.ts`)

Returns `{ conversation, companion, language, isLoading, error }`.

1. Load active companion (`is_active = true`, most recent) and profile language
2. Load the user's most recent conversation (`order('created_at', desc).limit(1).maybeSingle()`)
3. If none: `INSERT` conversation `{ user_id, companion_id }`, then `INSERT` the greeting as an `assistant` message (matched from `COMPANION_PRESETS` by companion name, fallback to first preset; language from profile)
4. `cancelled` cleanup flag pattern (same as `useOnboardingStatus`)

Two-device race can create two conversations — accepted for MVP; "most recent" keeps behavior deterministic. Noted in Future considerations.

### 4. `streamChatReply` (`src/lib/api.ts`)

```ts
export async function streamChatReply(opts: {
  conversationId: string;
  onToken: (token: string) => void;
  signal?: AbortSignal;
}): Promise<void>  // resolves on {"done":true}, throws on error
```

- Uses `fetch` from **`expo/fetch`** (SDK 56 — supports response streaming in React Native; RN's global fetch does not)
- URL: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/chat`
- Headers: `Authorization: Bearer <session.access_token>` (from `supabase.auth.getSession()`), `apikey: <anon key>`, `Content-Type: application/json`
- Reads `response.body.getReader()` + `TextDecoder`, buffers, splits on `\n\n`, parses `data: {...}` JSON events
- Non-2xx or `{"error": ...}` event → throw with a generic message (raw errors never reach the UI)

### 5. `useChat` hook (`src/hooks/useChat.ts`)

Returns `{ messages, streamingText, isStreaming, isLoadingOlder, hasMore, error, send, loadOlder, retry }`.

- **Initial load**: latest 30 messages (`order created_at desc, limit 30`), stored newest-first (inverted list)
- **`loadOlder()`**: cursor = oldest loaded `created_at`; fetch 30 more with `.lt('created_at', cursor)`; `hasMore = fetched === 30`
- **`send(text)`**: trim (ignore empty), cap at 2000 chars; optimistic append + `INSERT` user message; on insert failure → remove optimistic message, show error. Then set `isStreaming`, call `streamChatReply` accumulating `streamingText`; on done → append final assistant message locally from accumulated text and clear streaming state; on stream error → keep the user message, show error with `retry` (retry re-calls the Edge Function only, without re-inserting the user message)
- Input disabled while `isStreaming` (prevents interleaved requests)
- Abort the in-flight stream on unmount (`AbortController`)

### 6. Chat screen (`src/app/(tabs)/chat.tsx`)

Per `ui_context.md` (Chat variant B, minus action cards):

- **Header**: `CompanionAvatar` (terracotta circle, white initial) + companion name (subheading, semibold) + static subtitle "Toujours là pour toi" / "Always here for you" (caption, muted); bottom hairline border
- **Message list**: inverted `FlatList`; `onEndReached` (top, since inverted) → `loadOlder()` with a small spinner; bubbles max-width ~80%, fade+slide-in animation ≤200ms
- **Streaming bubble**: companion-style bubble rendering `streamingText`; `TypingDots` shown while `isStreaming` and no token received yet
- **SuggestionChips**: shown when messages ≤ 1 (just the greeting); 3 static starters (e.g. « Raconte-moi ta journée », « J'ai besoin de parler », « Donne-moi un boost ») — tapping one sends it via `send()`
- **ChatInput**: `bg-card rounded-input border` field + circular terracotta send button (44×44pt); multiline, max ~4 lines; send disabled when empty or streaming
- `KeyboardAvoidingView` (behavior `padding` on iOS, `height` on Android); safe-area padding above the tab bar
- Error banner (friendly text + retry) on send/stream failure

### 7. Components

- **`ChatBubble`** — props `{ role: 'user' | 'assistant', content, animate? }`. Companion: `bg-companion-bubble` (dark: `bg-dark-background-card`) left-aligned, dark-brown text. User: `bg-user-bubble` right-aligned, white text. `rounded-bubble`, 12pt inner padding. No timestamps in MVP (kept minimal)
- **`TypingDots`** — 3 dots, staggered opacity loop via `react-native-reanimated`, <300ms per pulse
- **`SuggestionChips`** — outlined `rounded-chip` pills, horizontal wrap
- **`ChatInput`** — controlled input + send button, disabled states per above

All colors via NativeWind tokens — no raw hex. All user-facing strings from `chat-i18n.ts` (mirrors `onboarding-i18n.ts` `t(lang)` pattern; the `// TODO: i18n` convention is satisfied by the centralized i18n files).

---

## Edge cases

| Case | Behavior |
|---|---|
| First open ever | Conversation created + companion greeting visible immediately |
| Offline / network error on send | User message insert fails → optimistic message removed, error + retry shown |
| Stream drops mid-reply | Server already accumulates; if its insert succeeded the reply appears on next load. Client shows error + retry |
| App killed mid-stream | Assistant message persisted server-side → visible on next open |
| Empty / whitespace message | Send ignored, button disabled |
| Very long input | Capped at 2000 chars |
| Rapid double-send | Input disabled while streaming |
| No active companion (data anomaly) | Chat shows friendly empty state; root routing already pushes such users to onboarding |
| Two devices open simultaneously | May create duplicate conversation (rare) — most recent wins; accepted for MVP |

---

## Security considerations

- OpenRouter key stays in Edge Function env — never in the client bundle
- `models` fallback array on every OpenRouter call (invariant)
- All DB access in the Edge Function uses the **user-scoped** client (anon key + caller JWT) — RLS enforced end-to-end; no `service_role` anywhere
- Client sends only `conversation_id`; context is rebuilt server-side
- No message content in logs (server or client), no content in error messages
- Raw provider/Supabase errors never surface to the UI

---

## Checklist (must pass before marking complete)

- [ ] Edge Function streams normalized SSE and persists the assistant message server-side
- [ ] Every OpenRouter call uses the `models` array + `route: fallback` + `stream: true`
- [ ] Single conversation get-or-create works; greeting inserted on first creation (FR + EN)
- [ ] Sending a message: optimistic user bubble → typing dots → token-by-token reply
- [ ] Assistant reply persisted — visible after app restart
- [ ] Pagination: opening loads 30, scrolling up loads older batches
- [ ] Suggestion chips shown on near-empty conversation and send correctly
- [ ] Input disabled while streaming; empty sends impossible
- [ ] Keyboard avoidance works (input never hidden by keyboard)
- [ ] Error + retry states for send failure and stream failure
- [ ] All UI strings bilingual via `chat-i18n.ts`; no raw hex colors
- [ ] No `console.log` in committed app code; no secrets; no message content logged
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `progress_tracker.md` updated
