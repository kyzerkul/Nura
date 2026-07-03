# Feature Spec: 06 — Agentic Notifications

> **Phase**: 2 (Build)
> **Status**: in_progress
> **Depends on**: `05_chat` complete

---

## Goal

The companion becomes proactive — the product differentiator. A Trigger.dev
scheduled job periodically finds users who are due for a check-in, generates a
short warm follow-up message **in the companion's voice** from the user's
recent conversation, stores it as a normal assistant message (visible in the
chat on next open), and delivers it as a push notification via Expo Push
Notification Service.

After this unit: a user who chatted yesterday and enabled notifications
receives, without any action on her part, a push like
*« Amina ✨ — Hey, tu m'avais parlé de ton entretien… alors, ça a donné quoi ? »*
and tapping it opens the chat with that message already in the thread.

**Product decisions (made in this spec — flag to founder if wrong):**
- **One global hourly cron scan** instead of one Trigger.dev schedule per user.
  Eligibility (frequency, quiet hours, anti-spam) is evaluated inside the job.
  Rationale: no schedule lifecycle to manage on signup/settings change/account
  deletion; one moving part; per-user cadence still respected.
- **Quiet hours 21:00–09:00 local** — never notify at night. The app silently
  saves the device IANA timezone to `profiles.timezone`; if unknown, UTC is
  assumed.
- **Anti-spam**: no new check-in until the user has replied to the previous
  one, except a single re-engagement nudge allowed after 7 days of silence.
- **Permission prompt timing**: OS permission is requested on first entry into
  the authenticated tab area (simple for MVP; a pre-permission explainer
  screen can come with spec 07 settings work).

---

## Scope

### In scope

1. Migration 003: `profiles.timezone`, `profiles.last_proactive_at`
2. Client push registration: `expo-notifications` permission flow, Expo push
   token upsert into `push_tokens`, Android notification channel, timezone sync
3. Notification tap → navigate to the Chat tab; foreground notifications shown
4. Trigger.dev v4 project scaffold: `trigger.config.ts`, `src/trigger/`
5. Scheduled task `proactive-checkin` (hourly cron): eligibility scan →
   AI generation (OpenRouter, `models` fallback array) → insert assistant
   message → Expo push send → bookkeeping
6. Expo push ticket error handling: prune `DeviceNotRegistered` tokens
7. `.env.example` updated (`TRIGGER_PROJECT_REF`)

### Out of scope

- Settings UI for notification frequency (spec 07 — the DB column and default
  `daily` already exist)
- Conversation summary **generation** (separate follow-up; the job reads the
  summary if present, same as the chat Edge Function)
- Pre-permission explainer screen / re-ask flow after a denial
- Notification history screen, badges, notification categories/actions
- PostHog events (`notification_received`, `notification_opened`) — PostHog
  still not installed, deferred with the other analytics events
- iOS push testing (requires a paid Apple developer account + dev build; the
  code path is identical)

---

## Architecture — job flow

```text
[Trigger.dev: proactive-checkin]  (cron: 0 * * * *, service-role key, server-only)
  1. profiles WHERE notification_frequency != 'off'
  2. Filter in-process:
       - frequency threshold vs last_proactive_at
           daily → ≥ 20h   twice_daily → ≥ 8h   weekly → ≥ 144h
       - local hour in [09, 21) per profiles.timezone (UTC if null)
  3. push_tokens for remaining users (single .in() query) — skip users with none
  4. Per user (isolated try/catch, one failure never kills the batch):
       a. most recent conversation + its companion (persona, name)
       b. last 10 messages + summary (if any)
       c. skip if: no user message ever · last user message < 3h ago ·
          no user reply since last_proactive_at (unless > 7 days → one nudge)
       d. OpenRouter (models fallback array, no streaming, max_tokens 200):
          short check-in in persona voice + user language
       e. INSERT messages { role: 'assistant', content }
       f. POST https://exp.host/--/api/v2/push/send
          title: companion name · body: message (truncated 178 chars)
          data: { url: '/chat' }
       g. prune tokens whose ticket says DeviceNotRegistered
       h. UPDATE profiles.last_proactive_at = now()

[Mobile app]
  - (tabs)/_layout mounts usePushNotifications():
      permission → getExpoPushTokenAsync({ projectId }) →
      upsert push_tokens (user_id, device_id) → sync profiles.timezone
  - Tap on notification → router navigates to /(tabs)/chat
  - Message is already in the thread (inserted server-side at step e)
```

**Why insert the message before sending the push**: the push is a pointer, not
the source of truth. If push delivery fails, the check-in still appears in-app
— consistent with the chat unit where persistence is server-side.

**Why require ≥ 1 push token**: without a deliverable device, proactive
messages would silently pile up in the thread and read as spam on next open.

---

## Files to create or modify

| Action | File | Purpose |
|---|---|---|
| **Create** | `supabase/migrations/003_notifications.sql` | `profiles.timezone`, `profiles.last_proactive_at` |
| **Modify** | `src/types/database.ts` | Add the two new `profiles` columns |
| **Create** | `src/lib/notifications.ts` | Permission flow, token registration, channel setup, timezone sync |
| **Create** | `src/hooks/usePushNotifications.ts` | Mounts registration + tap-response navigation |
| **Modify** | `src/app/(tabs)/_layout.tsx` | Call `usePushNotifications()` |
| **Create** | `trigger.config.ts` | Trigger.dev v4 project config (`dirs: ['./src/trigger']`) |
| **Create** | `src/trigger/proactive-checkin.ts` | The hourly scheduled task |
| **Create** | `src/trigger/lib/supabase-admin.ts` | Service-role Supabase client (server-only) |
| **Create** | `src/trigger/lib/openrouter.ts` | Non-streaming completion helper (models array invariant) |
| **Create** | `src/trigger/lib/expo-push.ts` | Expo push send + ticket parsing |
| **Modify** | `app.json` | `expo-notifications` plugin |
| **Modify** | `.env.example` | `TRIGGER_PROJECT_REF` |
| **Modify** | `package.json` | `expo-notifications`, `expo-crypto`, `@trigger.dev/sdk` |

---

## Implementation details

### 1. Migration 003

```sql
ALTER TABLE profiles
  ADD COLUMN timezone TEXT,
  ADD COLUMN last_proactive_at TIMESTAMPTZ;
```

No RLS changes: existing `profiles` policies cover the user updating her own
timezone; the job uses the service-role key (bypasses RLS, server-only).

### 2. Client registration (`src/lib/notifications.ts`)

`registerForPushNotifications(userId)` — all steps fail soft (never block the
UI, never throw to the caller):

- Skip if not a physical device (`expo-device`)
- Skip in **Expo Go on Android** (`Constants.executionEnvironment ===
  'storeClient'`): remote push was removed from Expo Go in SDK 53+ — a
  development build is required to test delivery
- Skip if `Constants.expoConfig.extra.eas.projectId` is absent (EAS not
  initialized yet) — `getExpoPushTokenAsync` requires it
- Permission: `getPermissionsAsync()` → request only if `canAskAgain`; abort
  silently if denied
- Android: create channel `default` (importance HIGH, brand light color from
  `constants/colors.ts`)
- `device_id`: UUID generated once via `expo-crypto` and persisted in
  SecureStore (`nura_device_id`) — stable per install, survives token rotation
- Upsert into `push_tokens` with `onConflict: 'user_id,device_id'`
- Update `profiles.timezone` from `Intl.DateTimeFormat().resolvedOptions().timeZone`
  (only when it differs)

`setNotificationHandler` shows alerts in foreground (banner, no badge).

### 3. `usePushNotifications` hook

- On session available: run registration once per app session
- `addNotificationResponseReceivedListener`: on tap →
  `router.navigate('/(tabs)/chat')` (data.url reserved for future deep links)
- Cleanup listeners on unmount

### 4. Trigger.dev task (`src/trigger/proactive-checkin.ts`)

- `schedules.task({ id: 'proactive-checkin', cron: '0 * * * *', ... })`
- Env (Trigger.dev dashboard only, never in the app bundle):
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`
- Per-run cap: 50 users (beta scale; raise later)
- Logging: counts and user ids only — **never message content, emails, or
  push tokens** (invariant 7)

**Generation prompt** (system): companion persona + language line + same v1
guardrails as the chat Edge Function + task instruction: *"Tu envoies
spontanément un petit message pour prendre des nouvelles, en te basant sur les
derniers échanges. 1 à 3 phrases, chaleureux, en restant dans ton personnage.
Une seule question maximum. Réponds uniquement avec le message, rien d'autre."*
Context: summary block + last 10 messages inline (role-labeled). Empty or
whitespace-only generation → skip user (no insert, no push, no bookkeeping).

**OpenRouter call** — the invariant holds everywhere:

```jsonc
{
  "models": ["deepseek/deepseek-v4-flash", "minimax/minimax-m2.5"],
  "route": "fallback",
  "max_tokens": 200,
  "messages": [system, user]
}
```

### 5. Expo push send (`src/trigger/lib/expo-push.ts`)

- `POST https://exp.host/--/api/v2/push/send`, one request per user (≤ a few
  tokens each; batching across users can come later)
- Message: `{ to, sound: 'default', title: companionName, body, data: { url: '/chat' } }`
- Parse tickets: on `DeviceNotRegistered` → delete that `push_tokens` row
- Other ticket errors: log the error code only, continue

### 6. app.json

Add `"expo-notifications"` to plugins (defaults; icon/color polish can come
with a dev-build unit). `eas init` will add `extra.eas.projectId` — founder
action, not committed by hand.

---

## Edge cases

| Case | Behavior |
|---|---|
| User denied OS permission | Registration aborts silently; no tokens → job skips her |
| Expo Go on Android | Registration skipped (SDK 53+ limitation); in-app flow unaffected |
| EAS projectId not set yet | Registration skipped gracefully; nothing crashes |
| User never sent a message | No check-in (nothing to follow up on) |
| User mid-conversation (< 3h) | Skipped this run — don't interrupt |
| User never replied to last check-in | Skipped until she replies; one nudge allowed after 7 days |
| `timezone` null | UTC assumed for quiet hours |
| Token invalid (`DeviceNotRegistered`) | Row deleted; user with zero remaining tokens skipped next runs |
| OpenRouter down for one user | try/catch per user — batch continues; her `last_proactive_at` untouched, retried next run |
| Push send fails after message insert | Message still visible in-app; `last_proactive_at` still updated (no duplicate check-in) |
| Multiple devices | All tokens for the user receive the same push |

---

## Security considerations

- `SUPABASE_SERVICE_ROLE_KEY` and `OPENROUTER_API_KEY` live **only** in
  Trigger.dev environment variables (invariant 5) — `src/trigger/` code is
  never bundled into the app (separate entry point, deployed by Trigger CLI)
- Every OpenRouter call uses the `models` fallback array (invariant 2)
- Pushes are sent exclusively to tokens from `push_tokens` rows of the target
  user (invariant 6)
- No message content, email, or token value in any log (invariant 7)
- Client-side writes (`push_tokens`, `profiles.timezone`) go through the
  user-scoped client under existing RLS policies
- Account deletion: `push_tokens` already `ON DELETE CASCADE` (invariant 8)

---

## Founder actions required (one-time infra)

1. Run migration `003_notifications.sql` in Supabase (SQL Editor or `db push`)
2. Create the Trigger.dev project (dashboard) → copy the project ref into
   `.env` as `TRIGGER_PROJECT_REF`
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY` in
   Trigger.dev → Environment Variables (prod + dev)
4. `npx trigger.dev@latest dev` to test locally, then
   `npx trigger.dev@latest deploy`
5. `eas init` (adds `extra.eas.projectId` to app.json) — required for
   `getExpoPushTokenAsync`
6. Build a **development build** (`eas build --profile development`) to test
   push on Android — Expo Go can't receive remote pushes since SDK 53

---

## Checklist (must pass before marking complete)

- [x] Migration 003 written; `database.ts` types updated
- [x] Push registration: permission → token → upsert → timezone, all fail-soft
- [x] Registration skipped cleanly in Expo Go / without projectId
- [x] Tap on a notification navigates to the Chat tab
- [x] `proactive-checkin` task compiles and respects: frequency thresholds,
      quiet hours, ≥ 3h inactivity, reply-gating + 7-day nudge, 50-user cap
- [x] Check-in message inserted as `assistant` message before push send
- [x] Every OpenRouter call uses the `models` array + `route: fallback`
- [x] `DeviceNotRegistered` tokens pruned
- [x] No secrets in the app bundle; service-role key only in Trigger.dev env
- [x] No message content / emails / tokens in logs
- [x] `npx tsc --noEmit` passes with zero errors; ESLint clean on touched files
- [x] `progress_tracker.md` updated

> Code-level items verified by static checks and review. End-to-end runtime
> verification (job firing, push delivery on device) is blocked on the
> one-time founder infra actions above (Trigger.dev project, `eas init`,
> development build) — the unit stays `in_progress` until then.
