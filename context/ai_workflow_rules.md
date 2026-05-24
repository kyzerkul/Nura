# Nura — AI Agent Workflow Rules

These rules define how the AI coding agent behaves on this project. They exist to prevent the most common failure modes: scope drift, security mistakes, and context loss.

---

## Rule 1 — Read before acting

Before writing a single line of code, read:
1. `context/project_overview.md`
2. `context/architecture.md`
3. `context/code_standards.md`
4. `context/ui_context.md`
5. `context/progress_tracker.md`
6. The current feature spec (if working on a feature)

If a context file contradicts the spec, flag it — don't resolve it silently.

---

## Rule 2 — One unit at a time

Work on exactly one feature unit per session. A "unit" is defined by a spec file in `context/feature_specs/`.

- Do not start working on Feature 03 while Feature 02 is in progress
- Do not refactor unrelated code while implementing a feature
- Do not add "nice to have" improvements not in the spec

If you identify improvements outside the current spec, note them in `progress_tracker.md` under "Future considerations" and do nothing else.

---

## Rule 3 — Security rules are non-negotiable

The following are hard rules. Never break them for convenience:

- OpenRouter API key → Edge Function environment only, never in the app bundle
- Supabase service role key → Trigger.dev / Edge Function environment only
- Supabase RLS → must be enabled on every table before writing any query against it
- Authentication check → required before every mutation (create, update, delete)
- Push tokens → only sent to the owning user's devices

If implementing a feature requires breaking one of these rules, stop and ask.

---

## Rule 4 — Update the progress tracker

At the start of a unit: mark it `in_progress` in `progress_tracker.md`.
At the end of a unit: mark it `completed` and record:
- What was built
- Any architectural decision made (even small ones)
- Any deviation from the spec and why

This file is the memory of the project. Keep it accurate.

---

## Rule 5 — Verify before marking done

A unit is not done until:
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No ESLint errors on touched files
- [ ] The feature works as described in the spec checklist
- [ ] No `console.log` or debug code left in committed files
- [ ] No hardcoded secrets, URLs, or test user IDs

---

## Rule 6 — When in doubt, ask

If the spec is ambiguous on a design decision, stop and surface the question. Do not guess and implement. The cost of asking is one message. The cost of guessing wrong is hours of reverting.

Phrases that should trigger a pause and a question:
- "I'm not sure which approach to use..."
- "The spec doesn't specify..."
- "There are two ways to do this..."

---

## Rule 7 — Scope of prompts

When the user gives a prompt that references a spec file:
- Implement only what is in that spec
- Do not add features from future specs "since we're already touching this file"
- Do not modify files outside the list in the spec unless the spec explicitly says to

---

## Rule 8 — Focus on mobile-first patterns

This is a React Native / Expo app. Apply mobile-first thinking:
- Keyboard avoidance for chat input
- Loading states are visible and non-blocking
- Network errors are handled gracefully (offline-aware when possible)
- Screens are scrollable when content can overflow
- Touch targets are at least 44×44pt

Do not apply web patterns (hover states, right-click menus, mouse cursor behavior).

---

## Rule 9 — Respect the design system

Once `ui_context.md` is populated with tokens after the design phase:
- Never introduce a color, font size, or spacing value not in the token system
- Never override NativeWind with inline styles except for animated values
- All new components follow the established patterns in `components/`

---

## Rule 10 — Language awareness

The app supports French and English. Any hardcoded string that will be shown to the user must:
- Either be placed in a translation file (when i18n is set up)
- Or be flagged with a `// TODO: i18n` comment so it can be found and extracted later

Never hardcode UI text directly in components without noting it needs translation.
