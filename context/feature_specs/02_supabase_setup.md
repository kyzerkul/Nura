# Feature Spec: 02 — Supabase Setup

> **Phase**: 2 (Build)
> **Status**: pending
> **Depends on**: `01_design_system` complete

---

## Goal

Connect the Expo app to Supabase, define the full database schema with Row Level Security (RLS) on every table, create shared TypeScript types for the schema, and scaffold the Edge Function that will proxy AI calls to OpenRouter.

After this unit, the app can authenticate (spec 03), read/write user data, and call the AI — all with enforced data isolation at the database level.

---

## Scope

### In scope

1. Install `@supabase/supabase-js` and `react-native-url-polyfill`
2. Create `src/lib/supabase.ts` — client-side Supabase client (anon key only)
3. Configure environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
4. Create shared TypeScript types in `src/types/database.ts`
5. Write SQL migration for all tables: `profiles`, `companions`, `conversations`, `messages`, `conversation_summaries`, `push_tokens`
6. Write RLS policies for every table (user can only access own data)
7. Scaffold Supabase Edge Function `chat` (receives messages, calls OpenRouter, returns response)
8. Create `.env.example` with placeholder keys

### Out of scope

- Authentication flows (spec 03)
- Chat UI or message rendering (spec 05)
- Trigger.dev jobs (spec 06)
- PostHog integration (later)
- Supabase Storage buckets (deferred until profile picture feature)

---

## Dependencies to install

```bash
npx expo install @supabase/supabase-js react-native-url-polyfill expo-secure-store
```

- `@supabase/supabase-js` — Supabase client SDK
- `react-native-url-polyfill` — required for Supabase on React Native (URL API polyfill)
- `expo-secure-store` — secure token persistence for Supabase Auth sessions

---

## Files to create or modify

| Action | File | Purpose |
|---|---|---|
| **Create** | `src/lib/supabase.ts` | Supabase client (anon key, secure session storage) |
| **Create** | `src/types/database.ts` | TypeScript types for all DB tables |
| **Create** | `.env.example` | Template for environment variables |
| **Create** | `supabase/migrations/001_initial_schema.sql` | Full schema + RLS policies |
| **Create** | `supabase/functions/chat/index.ts` | Edge Function scaffold for AI proxy |
| **Modify** | `app.json` | (no change needed — Expo SDK 56 reads `EXPO_PUBLIC_*` env vars natively) |
| **Modify** | `package.json` | New dependencies added by `npx expo install` |

---

## Implementation details

### 1. Environment variables

Create `.env` (gitignored) and `.env.example` (committed):

```env
# .env.example — copy to .env and fill in real values
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Expo SDK 56 automatically exposes `EXPO_PUBLIC_*` variables via `process.env`. No `app.json` extra config needed.

### 2. Supabase client (`src/lib/supabase.ts`)

```ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Key decisions:
- `expo-secure-store` for encrypted token persistence (not AsyncStorage)
- `detectSessionInUrl: false` — not a web app, no OAuth redirects via URL
- Generic `<Database>` type for full type safety on queries
- **No `service_role` key** — ever — in client code

### 3. TypeScript types (`src/types/database.ts`)

Define the `Database` type that maps to the Supabase schema. This enables typed `.from('table')` queries.

```ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      companions: {
        Row: Companion;
        Insert: CompanionInsert;
        Update: CompanionUpdate;
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: ConversationUpdate;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
      conversation_summaries: {
        Row: ConversationSummary;
        Insert: ConversationSummaryInsert;
        Update: ConversationSummaryUpdate;
      };
      push_tokens: {
        Row: PushToken;
        Insert: PushTokenInsert;
        Update: PushTokenUpdate;
      };
    };
  };
};

// --- Row types (what you SELECT) ---

export type Profile = {
  id: string;                          // UUID, matches auth.users.id
  display_name: string | null;
  language: 'fr' | 'en';
  notification_frequency: 'off' | 'daily' | 'twice_daily' | 'weekly';
  created_at: string;
  updated_at: string;
};

export type Companion = {
  id: string;                          // UUID
  user_id: string;                     // FK → profiles.id
  name: string;                        // Companion display name
  persona: string;                     // System prompt personality descriptor
  tone: 'warm' | 'playful' | 'calm';  // Personality tone
  is_active: boolean;                  // Only one active per user
  created_at: string;
};

export type Conversation = {
  id: string;                          // UUID
  user_id: string;                     // FK → profiles.id
  companion_id: string;               // FK → companions.id
  title: string | null;                // Auto-generated or null
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;                          // UUID
  conversation_id: string;            // FK → conversations.id
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

export type ConversationSummary = {
  id: string;                          // UUID
  conversation_id: string;            // FK → conversations.id
  summary: string;                     // Compressed context for AI
  message_count: number;               // Messages summarized so far
  created_at: string;
  updated_at: string;
};

export type PushToken = {
  id: string;                          // UUID
  user_id: string;                     // FK → profiles.id
  token: string;                       // Expo push token
  device_id: string;                   // Unique device identifier
  created_at: string;
};

// --- Insert types (omit server-generated fields) ---

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type CompanionInsert = Omit<Companion, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type MessageInsert = Omit<Message, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type ConversationSummaryInsert = Omit<ConversationSummary, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PushTokenInsert = Omit<PushToken, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// --- Update types (all fields optional except id) ---

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>> & {
  updated_at?: string;
};

export type CompanionUpdate = Partial<Omit<Companion, 'id' | 'user_id' | 'created_at'>>;

export type ConversationUpdate = Partial<Omit<Conversation, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string;
};

export type MessageUpdate = Partial<Omit<Message, 'id' | 'conversation_id' | 'created_at'>>;

export type ConversationSummaryUpdate = Partial<Omit<ConversationSummary, 'id' | 'conversation_id' | 'created_at'>> & {
  updated_at?: string;
};

export type PushTokenUpdate = Partial<Omit<PushToken, 'id' | 'user_id' | 'created_at'>>;
```

### 4. Database schema (`supabase/migrations/001_initial_schema.sql`)

All tables, RLS policies, indexes, and triggers in a single migration.

```sql
-- ============================================================
-- Nura — Initial database schema
-- ============================================================

-- 1. PROFILES
-- Extends auth.users with app-specific data.
-- id matches auth.users.id (set on signup via trigger).

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  notification_frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (notification_frequency IN ('off', 'daily', 'twice_daily', 'weekly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. COMPANIONS

CREATE TABLE companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  persona TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'warm' CHECK (tone IN ('warm', 'playful', 'calm')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own companions"
  ON companions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own companions"
  ON companions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own companions"
  ON companions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own companions"
  ON companions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_companions_user_id ON companions(user_id);


-- 3. CONVERSATIONS

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);


-- 4. MESSAGES

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS via join: user owns the conversation that owns the message
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at DESC);


-- 5. CONVERSATION SUMMARIES

CREATE TABLE conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id)
);

ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own summaries"
  ON conversation_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_summaries.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can upsert own summaries"
  ON conversation_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_summaries.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own summaries"
  ON conversation_summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_summaries.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );


-- 6. PUSH TOKENS

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push tokens"
  ON push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on profiles, conversations, conversation_summaries

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_summaries_updated_at
  BEFORE UPDATE ON conversation_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Auto-create profile row when a new user signs up

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 5. Edge Function scaffold (`supabase/functions/chat/index.ts`)

This function:
- Verifies the user's JWT
- Reads the request body (messages array)
- Calls OpenRouter with the `models` fallback array
- Returns the AI response

```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // 1. Verify JWT — reject if not authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request body
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Call OpenRouter with fallback model array
    const openRouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SUPABASE_URL,
          'X-Title': 'Nura',
        },
        body: JSON.stringify({
          models: [
            'deepseek/deepseek-v4-flash:free',
            'minimax/minimax-m2.5:free'
          ],
          route: 'fallback',
          messages,
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorBody = await openRouterResponse.text();
      console.error('OpenRouter error:', openRouterResponse.status, errorBody);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

**Security invariants enforced**:
- JWT verified before any processing
- OpenRouter key lives only in Edge Function env vars (set in Supabase dashboard)
- `models` array used — never a single model string
- No message content is logged (only error status codes)

**Model slugs**: Verified — `deepseek/deepseek-v4-flash:free` (primary) and `minimax/minimax-m2.5:free` (fallback). Both free tier.

---

## Environment variables reference

### Client-side (`.env`, read by Expo)

| Variable | Where it goes | Secret? |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | App bundle | No (public) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | App bundle | No (public, RLS protects data) |

### Server-side (Supabase Dashboard → Edge Function secrets)

| Variable | Where it goes | Secret? |
|---|---|---|
| `OPENROUTER_API_KEY` | Edge Function env | **YES — never in client** |
| `SUPABASE_URL` | Edge Function env (auto-injected by Supabase) | No |
| `SUPABASE_ANON_KEY` | Edge Function env (auto-injected by Supabase) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Trigger.dev env (spec 06) | **YES — never in client** |

---

## Checklist (must pass before marking complete)

- [ ] `@supabase/supabase-js`, `react-native-url-polyfill`, and `expo-secure-store` installed
- [ ] `src/lib/supabase.ts` creates a typed client with SecureStore adapter
- [ ] `src/types/database.ts` defines `Database` type with all 6 tables
- [ ] `.env.example` committed with placeholder values
- [ ] `.env` is in `.gitignore` (already done in Phase 0 — verify)
- [ ] SQL migration file covers all 6 tables with correct constraints
- [ ] RLS is enabled on every table with appropriate policies
- [ ] `profiles` auto-created on signup via `handle_new_user` trigger
- [ ] `updated_at` auto-updated via trigger on `profiles`, `conversations`, `conversation_summaries`
- [ ] `messages` and `conversation_summaries` RLS uses join-based check (user owns parent conversation)
- [ ] Edge Function `chat` verifies JWT before processing
- [ ] Edge Function uses `models` array (never single model string)
- [ ] No `service_role` key anywhere in client code
- [ ] No `console.log` in committed app code (Edge Function uses `console.error` for errors only)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `progress_tracker.md` updated

---

## Architectural notes

- **`profiles` vs `auth.users`**: Supabase Auth manages `auth.users` internally. We extend it with `profiles` for app-specific fields. The `handle_new_user` trigger ensures a profile row exists the moment a user signs up — no race condition where a user exists in Auth but not in our schema.

- **One active companion per user**: The `is_active` boolean on `companions` allows future multi-companion support without schema changes. For MVP, the app enforces one active companion in application logic (not a DB constraint), so the user can switch personas without losing history.

- **`conversation_summaries` is 1:1 with `conversations`**: Enforced by `UNIQUE(conversation_id)`. The summary is regenerated every 20 messages by a background job (spec 06). This keeps the AI context window small while preserving long-term memory.

- **`push_tokens` uses `UNIQUE(user_id, device_id)`**: A user can have multiple devices. If they reinstall or the token rotates, the upsert replaces the old token for that device.

- **Edge Function model slugs verified**: `deepseek/deepseek-v4-flash:free` (primary) and `minimax/minimax-m2.5:free` (fallback). Both free tier on OpenRouter.
