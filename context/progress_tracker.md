# Nura — Progress Tracker

> This file is updated after every completed feature unit. It is the agent's memory across sessions.
> At the start of every new session, read this file to know exactly where the project stands.

---

## Current phase

**PHASE 1 — Design**

Goal: Define the visual identity of Nura before writing any feature code. Wireframes, palette, typography, and design tokens must be finalized and added to `context/ui_context.md` before Phase 2 begins.

---

## Status

### Completed

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

### In progress

**Phase 1 — Design**
- [ ] Define visual identity (palette, typography, mood)
- [ ] Create wireframes for core screens: Splash, Onboarding, Companion selection, Chat, Profile
- [ ] Update `context/ui_context.md` with finalized design tokens
- [ ] Write `context/feature_specs/01_design_system.md`

### Upcoming

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
| Supabase | ✅ Ready | |
| Trigger.dev | ✅ Ready | |
| CodeRabbit | ✅ Ready | Connected to GitHub — reviews all PRs automatically |
| GitHub | ✅ Ready | https://github.com/kyzerkul/Nura |
| PostHog | ✅ Ready | |
| OpenRouter | ⏳ Pending | Verify exact model slugs for DeepSeek V4 + Minimax M2.5 on openrouter.ai |

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
