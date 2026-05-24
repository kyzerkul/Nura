# Nura — Architecture

## Tech stack

| Layer | Technology | Role |
|---|---|---|
| Mobile app | **Expo** (managed workflow, SDK 56) | Cross-platform iOS + Android, built on Windows |
| Styling | **NativeWind v4** (Tailwind for RN) | Utility-first styling with design tokens |
| Navigation | **Expo Router** (file-based) | Tab + stack navigation |
| Authentication | **Supabase Auth** | Email/password + OTP (phone), session management |
| Database | **Supabase Postgres** | User profiles, conversations, messages, companions |
| Storage | **Supabase Storage** | Profile pictures, future media assets |
| Realtime | **Supabase Realtime** | Live message streaming fallback if needed |
| AI (primary) | **OpenRouter → DeepSeek V4** | Main model — free tier, server-side only |
| AI (fallback) | **OpenRouter → Minimax M2.5** | Auto-fallback if DeepSeek is unavailable (to be updated) |
| AI API layer | **Supabase Edge Functions** | Serverless functions that call OpenRouter (never from client) |
| Agentic jobs | **Trigger.dev** | Scheduled background jobs: proactive notifications, check-ins |
| Push notifications | **Expo Push Notification Service (EPNS)** | Delivers notifications to iOS + Android |
| Analytics | **PostHog** (`posthog-react-native`) | Product events, funnels, retention, session replay |
| Language (app) | TypeScript strict mode | All code typed, no `any` |

---

## System boundaries

```
[Mobile App (Expo)]
    │
    ├─── Auth calls ──────────────────────▶ [Supabase Auth]
    │
    ├─── DB reads/writes ─────────────────▶ [Supabase Postgres] (RLS enforced)
    │
    ├─── AI chat requests ────────────────▶ [Supabase Edge Function: /chat]
    │                                              │
    │                                              └──▶ [OpenRouter API]
    │                                                      ├── DeepSeek V4    (primary)
    │                                                      └── Minimax M2.5   (auto-fallback)
    │
    ├─── Push token registration ─────────▶ [EPNS]
    │
    └─── Analytics events ────────────────▶ [PostHog Cloud]

[Trigger.dev workers] (server-side, no client exposure)
    │
    ├─── Read conversation summaries ─────▶ [Supabase Postgres]
    ├─── Generate notification content ──▶ [OpenRouter API → DeepSeek V4 / Minimax M2.5 fallback]
    └─── Send push notifications ─────────▶ [EPNS]
```

---

## OpenRouter fallback model strategy

OpenRouter supports native model fallback via the `models` array. This is used in **every** call — never a single model string.

```json
POST https://openrouter.ai/api/v1/chat/completions
{
  "models": [
    "deepseek/deepseek-v4",
    "minimax/minimax-m2.5"
  ],
  "route": "fallback",
  "messages": [...]
}
```

OpenRouter tries the first model; if it fails or times out, it automatically uses the next one. No retry logic needed in our Edge Function.

**Model IDs to verify at build time** (check `openrouter.ai/models` — exact IDs change as models are updated):
- Primary: DeepSeek V4 — verify exact slug on openrouter.ai
- Fallback: Minimax M2.5 — verify exact slug on openrouter.ai
- Fallback models will be reviewed and potentially updated in V2

**Invariant**: Every OpenRouter call must use the `models` array with both primary and fallback. Never call with a single `model` string.

---

## Storage model

| Data type | Where stored | Why |
|---|---|---|
| User profile | Supabase Postgres `users` table | Structured, queryable |
| Companion config | Supabase Postgres `companions` table | Linked to user |
| Conversation messages | Supabase Postgres `messages` table | Paginated history |
| Conversation summary | Supabase Postgres `conversation_summaries` | Compressed context for AI |
| Profile pictures | Supabase Storage | Binary blobs, not in DB |
| Expo push tokens | Supabase Postgres `push_tokens` table | Per-device, per-user |

---

## Security invariants — NEVER violate these

1. **OpenRouter API key is never sent to the client.** All AI calls go through Supabase Edge Functions. The key lives only in Edge Function environment variables.

2. **Every OpenRouter call uses the `models` fallback array** — never a single model. Resilience is mandatory, not optional.

3. **Row Level Security (RLS) is enabled on every Supabase table.** Users can only read and write their own data. This is enforced at the database level, not just in app code.

4. **Authentication is verified at every data mutation.** No write operation is accepted without a valid Supabase session JWT.

5. **Trigger.dev jobs authenticate against Supabase using a service-role key stored only in Trigger.dev environment variables.** This key is never in the mobile app.

6. **Expo push tokens are user-scoped.** A push notification is only ever sent to the token(s) belonging to the authenticated user who owns that conversation.

7. **No sensitive data is logged.** Message content, user emails, and push tokens must never appear in application logs or PostHog events.

8. **Conversation data belongs to the user.** Account deletion triggers a cascade that removes all messages, companions, summaries, and push tokens for that user.

9. **PostHog must never receive message content.** Only structural events are tracked (e.g., `chat_opened`, `message_sent` with no payload, `notification_received`). No PII in analytics.

---

## AI context window strategy

To keep AI responses coherent without blowing the context window:

1. Send the last **20 messages** of the current conversation to the model
2. Prepend a **conversation summary** (stored in DB, regenerated every 20 messages via background job)
3. Prepend the **system prompt** (companion persona + user language preference)
4. Total prompt budget: stay under **8,000 tokens** per request to keep it within free tier limits

---

## Agentic notification architecture

```
Trigger.dev cron job (per user, configurable frequency)
  │
  ├── 1. Read last 5 messages from Supabase for this user
  ├── 2. Read conversation summary
  ├── 3. Call OpenRouter (DeepSeek → fallback): generate warm follow-up from companion
  ├── 4. Store the generated message in Supabase (visible when user opens app)
  └── 5. Send push notification via EPNS with the generated message as body
```

---

## Analytics — PostHog

SDK: `posthog-react-native` — initialized in `app/_layout.tsx`.

Events to track (structural only, no content):
- `app_opened`
- `signup_completed`
- `companion_selected`
- `chat_opened`
- `message_sent` (count only, no content)
- `notification_received`
- `notification_opened`
- `settings_changed`

**Never track**: message content, companion name, user display name, or any text the user typed.

---

## Expo project structure

Expo SDK 56 uses `src/` as the root for all app code (Expo Router convention).
Requires Node.js ≥ 20.19.4 (or 22.x / 24.x).

```
d:\Nura\
├── CLAUDE.md
├── app.json                     ← Expo config (name: Nura, slug: nura)
├── package.json
├── tsconfig.json
├── context/                     ← 6-file context system (not part of the app)
├── assets/                      ← Icons, splash screens, images
└── src/
    ├── app/                     ← Expo Router pages
    │   ├── (auth)/              ← Public screens (login, signup)
    │   ├── (tabs)/              ← Authenticated tab layout
    │   │   ├── chat.tsx
    │   │   ├── profile.tsx
    │   │   └── settings.tsx
    │   └── _layout.tsx          ← PostHog provider initialized here
    ├── components/              ← Shared UI components
    ├── constants/               ← Colors, sizes, companion configs
    ├── hooks/                   ← Custom React hooks
    ├── lib/                     ← To be created
    │   ├── supabase.ts          ← Supabase client (anon key only)
    │   ├── api.ts               ← Wrappers for Edge Function calls
    │   ├── analytics.ts         ← PostHog event wrappers
    │   └── notifications.ts     ← Expo push token registration
    ├── types/                   ← Shared TypeScript types (to be created)
    └── trigger/                 ← Trigger.dev job definitions (to be created)
```
