# Nura — Progress Tracker

> This file is updated after every completed feature unit. It is the agent's memory across sessions.
> At the start of every new session, read this file to know exactly where the project stands.

---

## Current phase

**PHASE 1 — Design** ✅ COMPLETE

Goal: Define the visual identity of Nura before writing any feature code. Wireframes, palette, typography, and design tokens must be finalized and added to `context/ui_context.md` before Phase 2 begins.

**PHASE 2 — Build** (in progress)

Goal: Implement the app spec-by-spec, starting with `01_design_system`.

---

## Status

### Completed

#### Phase 1 — Design ✅
- [x] Define visual identity (palette, typography, mood)
- [x] Create wireframes for core screens (6 screens × 2 variants, choices made)
- [x] Update `context/ui_context.md` with finalized design tokens
- [x] Finalize body font → Plus Jakarta Sans
- [x] Write `context/feature_specs/01_design_system.md`

#### Phase 0 — Infrastructure ✅
- [x] Context folder structure created (`context/`, `context/feature_specs/`)
- [x] `CLAUDE.md` written at project root
- [x] `context/project_overview.md` written
- [x] `context/architecture.md` written
- [x] `context/code_standards.md` written
- [x] `context/ai_workflow_rules.md` written
- [x] `context/ui_context.md` initialized (placeholder — design tokens TBD)
- [x] `context/progress_tracker.md` initialized
- [x] Expo SDK 56 project initialized (managed workflow)
- [x] Project renamed from NuraTmp → Nura (`package.json`, `app.json`)
- [x] `.env` added to `.gitignore`
- [x] Node.js updated to v22 LTS
- [x] GitHub repo created: https://github.com/kyzerkul/Nura
- [x] Infrastructure PR reviewed by CodeRabbit ✅ — no issues found
- [x] PR merged to `main`

#### Phase 2 — Build (unit 01) ✅
- [x] `01_design_system` — NativeWind v4 + Tailwind + design tokens + base components

#### Phase 2 — Build (unit 02) ✅
- [x] `02_supabase_setup` — Supabase client, DB schema, RLS, Edge Function scaffold

#### Phase 2 — Build (unit 03) ✅
- [x] `03_authentication` — Auth provider, session management, login/signup/OTP/forgot-password screens, tab layout

### In progress

(none)

### Upcoming

**Phase 2 — Build (spec-driven, one unit at a time)**
- [x] `02_supabase_setup` — DB schema, RLS policies, Edge Function scaffold
- [x] `03_authentication` — Sign up, login, OTP, session persistence
- [ ] `04_onboarding` — Companion selection, intro flow
- [ ] `05_chat` — Chat screen, AI integration, message history
- [ ] `06_agentic_notifications` — Trigger.dev jobs, proactive push
- [ ] `07_profile_settings` — Profile, preferences, account deletion

---

## External accounts & services

| Service | Status | Notes |
|---|---|---|
| Supabase | ✅ Ready | |
| Trigger.dev | ✅ Ready | |
| CodeRabbit | ✅ Ready | Connected to GitHub — reviews all PRs automatically |
| GitHub | ✅ Ready | https://github.com/kyzerkul/Nura |
| PostHog | ✅ Ready | |
| OpenRouter | ✅ Ready | Slugs verified: `deepseek/deepseek-v4-flash:free` + `minimax/minimax-m2.5:free` |

---

## Architectural decisions log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-24 | DeepSeek V4 as primary AI model | Clarification from founder — misheard as Gemini during initial briefing |
| 2026-05-24 | Minimax M2.5 as fallback model (to be reviewed in V2) | Free alternative if DeepSeek unavailable |
| 2026-05-24 | OpenRouter `models` array for native fallback | Cleaner than try/catch — OpenRouter handles failover automatically |
| 2026-05-24 | Add PostHog analytics | Funnel, retention, event tracking — never log message content (privacy) |
| 2026-05-24 | Nura is an app for women — not defined by geography | Launches in francophone markets first, built for global scale from day 1 |
| 2026-05-24 | Supabase Auth (not Clerk) | RLS + auth share the same JWT natively — no sync complexity, smaller attack surface |
| 2026-05-23 | Supabase as backend (not Firebase) | Auth + DB + Storage + Realtime in one service, generous free tier, SQL |
| 2026-05-23 | All AI calls via Supabase Edge Functions | Never expose OpenRouter key to client |
| 2026-05-23 | Trigger.dev for agentic background jobs | Long-running jobs (>10s) need dedicated infrastructure with retries |
| 2026-05-23 | No payments in v1 | Free beta to gather real user feedback before monetization |
| 2026-05-23 | Expo managed workflow | Windows-compatible, fast setup, sufficient for MVP |
| 2026-05-23 | French + English from MVP | Launch market is francophone, product built for global scale |

---

## Session notes

### 2026-05-25 — Phase 2 unit 03: Authentication implemented
- `@expo/vector-icons` installed for tab bar icons
- `src/providers/AuthProvider.tsx` — React context with `session`, `isLoading`, `signOut`; listens to `onAuthStateChange`
- `src/hooks/useSession.ts` — convenience hook to consume auth context
- `src/lib/auth-errors.ts` — maps Supabase error messages to user-friendly French text
- `src/app/_layout.tsx` — wraps app in `AuthProvider`, splash screen stays visible until auth resolved
- `src/app/index.tsx` — redirects to `(tabs)` or `(auth)/login` based on session state
- `src/app/(auth)/_layout.tsx` — Stack layout, redirects to tabs if already authenticated
- `src/app/(auth)/login.tsx` — email + password login, links to signup/forgot-password/OTP
- `src/app/(auth)/signup.tsx` — email + password + display name, updates profile after signup
- `src/app/(auth)/verify-otp.tsx` — two-step phone OTP (send code → verify), 60s resend cooldown
- `src/app/(auth)/forgot-password.tsx` — sends reset email, shows confirmation state
- `src/app/(tabs)/_layout.tsx` — 4-tab bottom bar (Accueil/Chat/Journal/Moi) with Feather icons, brand colors
- `src/app/(tabs)/index.tsx` — home placeholder with sign-out button
- `src/app/(tabs)/chat.tsx`, `journal.tsx`, `profile.tsx` — placeholder screens
- `src/types/database.ts` — added `Relationships: []` + `Views/Functions/Enums/CompositeTypes` to fix supabase-js v2.106 generic resolution
- Deleted stale `.expo/types/router.d.ts` (will regenerate on next `expo start`)
- All user-facing strings marked with `// TODO: i18n`
- Form validation: email format, password ≥ 6 chars, display name 2–30 chars, phone +XX format, OTP 6 digits
- No `console.log`, no hardcoded secrets
- TypeScript compiles with zero errors (`npx tsc --noEmit`)
- **Limitation**: No emulator available — visual rendering not verified
- **Next action**: Write `04_onboarding.md` spec → implement companion selection and intro flow

### 2026-05-24 — Phase 2 unit 02: Supabase Setup implemented
- `@supabase/supabase-js`, `react-native-url-polyfill`, `expo-secure-store` installed
- `src/lib/supabase.ts` — typed client with SecureStore adapter, `detectSessionInUrl: false`
- `src/types/database.ts` — `Database` type with Row/Insert/Update for 6 tables
- `supabase/migrations/001_initial_schema.sql` — full schema: `profiles`, `companions`, `conversations`, `messages`, `conversation_summaries`, `push_tokens`
- RLS enabled on all 6 tables; `messages` and `conversation_summaries` use join-based policies
- `handle_new_user` trigger auto-creates profile on signup
- `update_updated_at` trigger on `profiles`, `conversations`, `conversation_summaries`
- `supabase/functions/chat/index.ts` — Edge Function scaffold: JWT verification, OpenRouter call with `models` fallback array
- Model slugs verified: `deepseek/deepseek-v4-flash:free` (primary), `minimax/minimax-m2.5:free` (fallback)
- `.env` created (gitignored), `.env.example` committed with placeholders
- `tsconfig.json` updated to exclude `supabase/functions` (Deno runtime, not Node)
- TypeScript compiles with zero errors (`npx tsc --noEmit`)
- No `console.log` in app code
- **Action requise**: exécuter la migration SQL dans le dashboard Supabase (SQL Editor → coller le contenu de `001_initial_schema.sql`)
- **Action requise**: ajouter `OPENROUTER_API_KEY` dans Supabase Dashboard → Edge Functions → Secrets
- **Next action**: Write `03_authentication.md` spec → implement auth flows

### 2026-05-24 — Phase 2 unit 01: Design System implemented
- NativeWind v4.2.4 + Tailwind CSS 3.4.19 installed and configured
- `tailwind.config.js` with full color palette, font families, fontSize scale, borderRadius tokens
- `metro.config.js` with `withNativeWind` wrapper
- `src/global.css` with @tailwind directives
- `src/constants/colors.ts` — light + dark color objects with `getColors()` helper
- `src/constants/fonts.ts` — Plus Jakarta Sans (4 weights) + Caveat Brush font loading map
- `src/app/_layout.tsx` — font loading via `useFonts`, splash screen, system color scheme detection
- 6 base components in `src/components/ui/`: Text, Button, Card, Avatar, Input, MoodPicker
- `app.json` splash/icon colors updated to brand beige (#f0eee9)
- `nativewind-env.d.ts` for TypeScript className support
- Default Expo template files cleaned up (themed-text, themed-view, app-tabs, etc. removed)
- `src/constants/theme.ts` deleted, replaced by `colors.ts`
- TypeScript compiles with zero errors (`npx tsc --noEmit`)
- Metro bundler starts without errors
- No console.log, no hardcoded hex in components, no raw secrets
- **Limitation**: No emulator available on this machine — visual rendering not verified
- **Next action**: Write `02_supabase_setup.md` spec → implement DB schema + RLS + Edge Function scaffold

### 2026-05-24 — Design phase: wireframes reviewed, tokens extracted
- Wireframes reviewed (6 screens × 2 variants each, from designer export)
- **Screen choices**: All B variants except Onboarding Personnalisation (A — wizard)
- Palette finalized: terracotta (#c96442) + beige (#f0eee9) + gold (#d9a55a) + dark mode browns
- Typography: Caveat Brush (brand), body font TBD (DM Sans / Manrope / Plus Jakarta Sans)
- Navigation: 4-tab bottom bar (Accueil, Chat, Journal, Moi)
- `context/ui_context.md` fully populated with design tokens, components, screen decisions
- **Next action: finalize body font → write `01_design_system.md` spec → start Phase 2**

### 2026-05-24 — Infrastructure complete, PR merged
- Phase 0 fully complete — all 6 context files written, Expo SDK 56 initialized
- Infrastructure PR reviewed by CodeRabbit with zero issues — merged to main
- Workflow established: feature branch → PR → CodeRabbit review → merge to main
- Stack finalized: Expo + Supabase + OpenRouter (DeepSeek V4 / Minimax M2.5) + Trigger.dev + PostHog
- **Next action: Phase 1 — Design (wireframes + visual identity + design tokens)**

### 2026-05-23 — Project kickoff
- Project concept defined: AI companion app for women
- 6-file context system initialized based on spec-driven agentic development methodology
- Stack decided, accounts created
