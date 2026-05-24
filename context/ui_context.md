# Nura — UI Context

> **Status: PLACEHOLDER** — Design tokens and visual language will be finalized during the Design Phase (Phase 2).
> Do not build feature UIs until this file is populated. The design system spec (`feature_specs/01_design_system.md`) will update this file.

---

## Design direction (agreed principles, pre-design)

- **Feeling**: Warm, safe, intimate — not clinical, not robotic, not generic
- **Cultural lens**: Designed for Africa. References, warmth, and color choices should feel local, not like a western app translated
- **Modes**: Support both Light and Dark mode (unlike dark-only apps)
- **Typography**: Readable at all sizes, supports French accents and special characters
- **Iconography**: Rounded, friendly — no sharp/aggressive icons

---

## Styling engine

- **NativeWind v4** — Tailwind CSS for React Native
- Tokens defined in `tailwind.config.js` and mirrored in `constants/colors.ts`
- All color references use token names, never raw hex values in component code

---

## Placeholder token structure (to be replaced after design phase)

```ts
// constants/colors.ts — PLACEHOLDER, will be replaced by design tokens
export const colors = {
  background: {
    primary: '#TBD',
    secondary: '#TBD',
    card: '#TBD',
  },
  text: {
    primary: '#TBD',
    secondary: '#TBD',
    muted: '#TBD',
  },
  accent: {
    primary: '#TBD',   // Main brand color
    secondary: '#TBD',
  },
  companion: {
    bubble: '#TBD',    // AI message bubble background
    text: '#TBD',
  },
  user: {
    bubble: '#TBD',    // User message bubble background
    text: '#TBD',
  },
  status: {
    success: '#TBD',
    error: '#TBD',
    warning: '#TBD',
  },
};
```

---

## Component conventions (to be detailed after design phase)

| Component | Status | Notes |
|---|---|---|
| ChatBubble | Not built | Distinct styles for user vs companion |
| CompanionAvatar | Not built | Rounded, with presence indicator |
| PrimaryButton | Not built | Main CTA style |
| TextInput (chat) | Not built | Multiline, keyboard-aware |
| NotificationCard | Not built | In-app notification display |
| OnboardingSlide | Not built | Full-screen, illustrated |

---

## Typography (placeholder)

- **Font family**: TBD — will be selected in design phase. Must support Latin Extended (French accents)
- **Scale**: TBD
- **Line height**: generous (1.5× minimum for readability)

---

## Screen layout rules (mobile)

- Bottom safe area padding on all screens with a fixed bottom element (chat input, tabs)
- Top safe area for screens with a custom header
- Horizontal padding: `px-4` (16pt) on all content screens
- Chat list: full-width bubbles with 12pt padding inside

---

## Animation principles (for future implementation)

- Messages animate in with a subtle fade + slide-up (16pt travel, 200ms)
- Loading indicator on AI response: animated typing dots
- Screen transitions: Expo Router defaults (no custom transitions in MVP)
- Keep animations under 300ms — fast feels responsive on low-end Android devices

---

## Reminder for the agent

Once the Design Phase delivers finalized tokens, update this file completely. Replace all `#TBD` values and `TBD` labels with actual values. From that point on, no component may use colors or sizes not defined here.
