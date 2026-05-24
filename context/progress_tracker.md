# Nura — Progress Tracker

> This file is updated after every completed feature unit. It is the agent's memory across sessions.
> At the start of every new session, read this file to know exactly where the project stands.

---

## Current phase

**PHASE 0 — Infrastructure Setup**

Goal: Context system, CLAUDE.md, and base Expo project in place before any feature work.

---

## Status

### Completed

- [x] Context folder structure created (`context/`, `context/feature_specs/`)
- [x] `CLAUDE.md` written at project root
- [x] `context/project_overview.md` written
- [x] `context/architecture.md` written
- [x] `context/code_standards.md` written
- [x] `context/ai_workflow_rules.md` written
- [x] `context/ui_context.md` written (placeholder — awaits design phase)
- [x] `context/progress_tracker.md` initialized

### In progress

- [ ] Expo project initialized (`npx create-expo-app`)

### Upcoming

**Phase 1 — Design**
- [ ] Define visual identity (palette, typography, component styles)
- [ ] Create wireframes for core screens: Onboarding, Companion selection, Chat, Profile
- [ ] Update `context/ui_context.md` with finalized design tokens
- [ ] Write `context/feature_specs/01_design_system.md`

**Phase 2 — Build (spec-driven, one unit at a time)**
- [ ] `01_design_system` — NativeWind setup + design tokens
- [ ] `02_supabase_setup` — DB schema, RLS policies, Edge Function scaffold
- [ ] `03_authentication` — Sign up, login, OTP, session persistence
- [ ] `04_onboarding` — Companion selection, intro flow
- [ ] `05_chat` — Chat screen, AI integration, message history
- [ ] `06_agentic_notifications` — Trigger.dev jobs, proactive push
- [ ] `07_profile_settings` — Profile, preferences, account deletion

---

## External accounts & services

| Service | Status | Notes |
|---|---|---|
| Supabase | ✅ Account created | |
| Trigger.dev | ✅ Account created | |
| CodeRabbit | ✅ Account created | Connected to GitHub repo |
| GitHub | ✅ Repo created | |
| PostHog | ✅ Account created | |
| OpenRouter | ⏳ Pending | Needed for DeepSeek V4 + Minimax M2.5 access — verify model slugs on openrouter.ai |

---

## Architectural decisions log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-24 | DeepSeek V4 as primary AI model (not Gemini Flash) | Clarification from founder — was misheard during initial briefing |
| 2026-05-24 | OpenRouter `models` array for native fallback | Cleaner than try/catch — OpenRouter handles failover automatically |
| 2026-05-24 | Minimax M2.5 as fallback model (to be reviewed in V2) | Free alternative if DeepSeek unavailable |
| 2026-05-24 | Add PostHog analytics | Product analytics for funnel, retention, event tracking — PostHog chosen for self-hostable option |
| 2026-05-24 | PostHog must never receive message content | Privacy — only structural events tracked |
| 2026-05-24 | Nura is not an "African app" — it's an app for women | Launches in francophone markets first but built for global scale from day 1 |
| 2026-05-23 | Use Supabase (not Firebase) as backend | Single service for auth + DB + storage + realtime; generous free tier; SQL = better for relational data |
| 2026-05-23 | All AI calls via Supabase Edge Functions | Never expose OpenRouter key to client |
| 2026-05-23 | Use Trigger.dev for agentic jobs | Long-running jobs (>10s) can't run in Edge Functions; Trigger handles retries and scheduling |
| 2026-05-23 | No payments in v1 | Free beta to get real user feedback before monetization |
| 2026-05-23 | Expo managed workflow (not bare) | Windows-compatible, faster setup, sufficient for MVP |
| 2026-05-23 | French + English from MVP | Launch market is francophone but product is built for global scale |

---

## Session notes

### 2026-05-23 — Infrastructure setup
- Project concept defined: AI companion for African women
- 6-file context system initialized based on spec-driven methodology
- Stack decided: Expo + Supabase + OpenRouter (Gemini Flash) + Trigger.dev
- Design phase must happen before any feature development
- Next action: initialize Expo project, then move to design phase
