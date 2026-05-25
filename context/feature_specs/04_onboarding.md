# Feature Spec: 04 — Onboarding & Companion Selection

> **Phase**: 2 (Build)
> **Status**: complete
> **Depends on**: `03_authentication` complete

---

## Goal

After signing up, new users go through a short onboarding wizard before landing on the main app. The wizard introduces Nura's value proposition, lets the user pick a language, choose a companion persona, and confirms the setup. Users who already have an active companion skip onboarding entirely.

After this unit, new signups follow a 4-step wizard; returning users go straight to `(tabs)`.

---

## Scope

### In scope

1. New route group `(onboarding)/` with 4 screens
2. Welcome screen — value proposition + CTA
3. Language preference screen — FR / EN selection
4. Companion selection screen — pick from 3 preset personas
5. Confirmation screen — recap chosen companion, first greeting
6. Routing logic: redirect new users (no active companion) to onboarding after auth
7. Write selected companion to `companions` table
8. Update language preference in `profiles` table
9. Skip onboarding if user already has an active companion (returning users / re-login)
10. Step indicator (progress dots)
11. Back navigation between steps
12. All UI text flagged with `// TODO: i18n`

### Out of scope

- Custom companion creation (user types a name) — not in MVP
- AI-generated intro conversation (that's spec 05: Chat)
- Companion changing after onboarding (that's spec 07: Profile & Settings)
- Animations beyond basic transitions (MVP keeps it simple)
- Onboarding for phone OTP users (same flow — they have a session too)

---

## Companion personas (hardcoded for MVP)

Three preset companions. Each has a name, tone, description, and system persona text (used later in chat prompts).

| Name | Tone | Short description (shown to user) | Persona (stored in DB, used in system prompt) |
|---|---|---|---|
| **Nura** | `warm` | "Douce et bienveillante, toujours à l'écoute" | "Tu es Nura, une confidente chaleureuse et empathique. Tu parles avec douceur, tu rassures, et tu t'intéresses sincèrement à ce que vit l'utilisatrice. Tu ne juges jamais." |
| **Amina** | `playful` | "Pétillante et motivante, elle te booste au quotidien" | "Tu es Amina, une amie énergique et positive. Tu utilises l'humour avec bienveillance, tu encourages, et tu apportes de la légèreté même dans les moments difficiles. Tu ne juges jamais." |
| **Seren** | `calm` | "Posée et réfléchie, elle t'aide à voir clair" | "Tu es Seren, une présence calme et apaisante. Tu prends le temps de réfléchir avant de répondre, tu poses des questions profondes, et tu guides vers la clarté intérieure. Tu ne juges jamais." |

These are defined in `src/constants/companions.ts` and used both in the onboarding UI and later in the chat system prompt.

---

## Files to create or modify

| Action | File | Purpose |
|---|---|---|
| **Create** | `src/constants/companions.ts` | Companion persona presets (3 personas) |
| **Create** | `src/app/(onboarding)/_layout.tsx` | Stack layout for onboarding screens, redirect if already onboarded |
| **Create** | `src/app/(onboarding)/welcome.tsx` | Step 1: value proposition |
| **Create** | `src/app/(onboarding)/language.tsx` | Step 2: language preference |
| **Create** | `src/app/(onboarding)/companion.tsx` | Step 3: companion selection |
| **Create** | `src/app/(onboarding)/ready.tsx` | Step 4: confirmation + first greeting |
| **Create** | `src/components/ui/StepIndicator.tsx` | Progress dots component (reusable) |
| **Create** | `src/hooks/useOnboardingStatus.ts` | Hook to check if user has completed onboarding |
| **Modify** | `src/app/index.tsx` | Route to `(onboarding)/welcome` if no active companion |
| **Modify** | `src/types/database.ts` | No changes needed — types already cover `companions` and `profiles` |

---

## Implementation details

### 1. Companion presets (`src/constants/companions.ts`)

```ts
type CompanionPreset = {
  name: string;
  tone: 'warm' | 'playful' | 'calm';
  description: string;
  persona: string;
  emoji: string;
};

export const COMPANION_PRESETS: CompanionPreset[] = [
  {
    name: 'Nura',
    tone: 'warm',
    description: 'Douce et bienveillante, toujours à l\'écoute', // TODO: i18n
    persona: 'Tu es Nura, une confidente chaleureuse et empathique...',
    emoji: '🤗',
  },
  {
    name: 'Amina',
    tone: 'playful',
    description: 'Pétillante et motivante, elle te booste au quotidien', // TODO: i18n
    persona: 'Tu es Amina, une amie énergique et positive...',
    emoji: '✨',
  },
  {
    name: 'Seren',
    tone: 'calm',
    description: 'Posée et réfléchie, elle t\'aide à voir clair', // TODO: i18n
    persona: 'Tu es Seren, une présence calme et apaisante...',
    emoji: '🌿',
  },
];
```

### 2. Onboarding status hook (`src/hooks/useOnboardingStatus.ts`)

Checks if the authenticated user has at least one active companion in the `companions` table.

```ts
export function useOnboardingStatus() {
  // Returns: { needsOnboarding: boolean; isLoading: boolean }
  // Query: supabase.from('companions').select('id').eq('user_id', userId).eq('is_active', true).limit(1)
  // needsOnboarding = true if query returns 0 rows
}
```

- Called in `src/app/index.tsx` to decide redirect target
- Called in `(onboarding)/_layout.tsx` to redirect away if already onboarded
- Uses a single query, no polling
- Returns `isLoading: true` while the query is in flight (splash stays visible)

### 3. Root index modification (`src/app/index.tsx`)

```ts
export default function Index() {
  const { session } = useSession();
  const { needsOnboarding, isLoading } = useOnboardingStatus();

  if (!session) return <Redirect href="/(auth)/login" />;
  if (isLoading) return null; // splash screen stays visible
  if (needsOnboarding) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(tabs)" />;
}
```

### 4. Onboarding layout (`src/app/(onboarding)/_layout.tsx`)

- If no session → `<Redirect href="/(auth)/login" />`
- If user already has an active companion → `<Redirect href="/(tabs)" />`
- Stack navigator with `headerShown: false`
- Screens animate with default Expo Router transitions

### 5. Step 1 — Welcome (`src/app/(onboarding)/welcome.tsx`)

Full-screen, centered layout:

- Brand text "nura" (Caveat Brush, large, centered)
- Tagline: "Ta confidente numérique" (// TODO: i18n)
- 3 feature bullets with icons:
  - 🤝 "Une écoute sincère, sans jugement" (// TODO: i18n)
  - 🔒 "Tes conversations restent privées" (// TODO: i18n)
  - 💬 "Elle prend de tes nouvelles" (// TODO: i18n)
- StepIndicator: step 1 of 4
- Primary button: "Commencer" (// TODO: i18n)
- Navigates to `/(onboarding)/language`

No back button on this screen (first step).

### 6. Step 2 — Language (`src/app/(onboarding)/language.tsx`)

Layout:

- Heading: "Tu préfères parler en…" (// TODO: i18n)
- Two selectable cards (full width):
  - 🇫🇷 **Français** — "Je parle français" (// TODO: i18n)
  - 🇬🇧 **English** — "I speak English" (// TODO: i18n)
- Selected card has terracotta border + soft background
- StepIndicator: step 2 of 4
- Primary button: "Suivant" (// TODO: i18n) — navigates to `/(onboarding)/companion`
- Back link: "← Retour" (// TODO: i18n) — navigates back

State: `selectedLanguage` defaults to `'fr'`. The chosen value is passed forward via route params or local state (not persisted to DB until step 4).

### 7. Step 3 — Companion selection (`src/app/(onboarding)/companion.tsx`)

Layout:

- Heading: "Choisis ta confidente" (// TODO: i18n)
- Subheading: "Tu pourras changer plus tard" (// TODO: i18n)
- 3 companion cards (vertical stack, one per persona):
  - Emoji + Name (bold)
  - Description text
  - Selected card: terracotta border + soft accent background
  - Unselected: default card style
- StepIndicator: step 3 of 4
- Primary button: "Choisir [Name]" (// TODO: i18n) — navigates to `/(onboarding)/ready`
- Back link: "← Retour" — navigates back

State: `selectedCompanion` (index into `COMPANION_PRESETS`). No default selection — user must tap one to enable the button.

### 8. Step 4 — Confirmation (`src/app/(onboarding)/ready.tsx`)

Layout:

- Large companion emoji (centered, 64px+)
- Heading: "Prête à commencer ?" (// TODO: i18n)
- Companion intro text: "{Name} est là pour toi. Parle-lui de ce que tu veux, quand tu veux." (// TODO: i18n)
- Reassurance: "Tes conversations sont privées et sécurisées 🔒" (// TODO: i18n)
- StepIndicator: step 4 of 4
- Primary button: "Commencer à parler" (// TODO: i18n) — triggers save and redirect
- Back link: "← Retour" — navigates back

On button press:
1. Set loading state
2. Get user ID from session
3. Update `profiles.language` with selected language
4. Insert companion row: `{ user_id, name, persona, tone, is_active: true }`
5. On success → `router.replace('/(tabs)')`
6. On error → show user-friendly error message

### 9. StepIndicator component (`src/components/ui/StepIndicator.tsx`)

Props: `currentStep: number`, `totalSteps: number`

- Row of circles (dots)
- Current step: filled terracotta circle
- Completed steps: filled terracotta circle
- Future steps: bordered muted circle
- Size: 8px diameter, 8px gap

### 10. State management across onboarding steps

Use Expo Router's local search params to pass state between screens:

```
welcome → language?lang=fr → companion?lang=fr&companion=0 → ready?lang=fr&companion=0
```

Each screen reads its needed params and adds its own choice. The final `ready.tsx` screen reads all params and performs the DB writes.

Alternative: use a simple React context or `useState` in the layout. Search params are simpler and don't require additional infrastructure.

---

## Database operations

### On onboarding completion (step 4 button press)

**Update language preference:**
```ts
await supabase
  .from('profiles')
  .update({ language: selectedLanguage })
  .eq('id', userId);
```

**Insert companion:**
```ts
const preset = COMPANION_PRESETS[selectedIndex];
await supabase
  .from('companions')
  .insert({
    user_id: userId,
    name: preset.name,
    persona: preset.persona,
    tone: preset.tone,
    is_active: true,
  });
```

Both operations require an authenticated session (RLS enforced). No service role key needed.

---

## Routing summary

```
App opens
  │
  ├── No session → (auth)/login
  │
  └── Session exists
        │
        ├── Has active companion → (tabs)
        │
        └── No active companion → (onboarding)/welcome
              │
              ├── Step 1: welcome
              ├── Step 2: language
              ├── Step 3: companion
              └── Step 4: ready → save → (tabs)
```

---

## Edge cases

| Case | Behavior |
|---|---|
| User kills app mid-onboarding | Next open: still no companion → back to `(onboarding)/welcome` |
| User logs out and back in after onboarding | Has companion → goes to `(tabs)` |
| User with phone OTP signup | Same flow — session is established, onboarding check applies |
| Network error during save | Show error message, button stays enabled for retry |
| User presses back from welcome | Nothing happens (first screen, no back) |

---

## Security considerations

- Companion insert uses authenticated session — RLS ensures user can only create their own companion
- Profile language update uses authenticated session — RLS enforced
- No sensitive data in companion presets (these are static, public strings)
- No `service_role` key used anywhere
- No logging of user choices

---

## Checklist (must pass before marking complete)

- [ ] `useOnboardingStatus` hook queries companions table and returns `needsOnboarding`
- [ ] New users (no companion) are redirected to `(onboarding)/welcome`
- [ ] Returning users (have companion) go straight to `(tabs)`
- [ ] Welcome screen shows value proposition + "Commencer" CTA
- [ ] Language screen allows FR/EN selection, persists through flow
- [ ] Companion screen shows 3 personas, selection is required to proceed
- [ ] Ready screen saves language + companion to DB on button press
- [ ] After save, user lands on `(tabs)` — cannot navigate back to onboarding
- [ ] StepIndicator component shows correct progress on each screen
- [ ] Back navigation works on steps 2, 3, 4
- [ ] Error states shown for failed DB writes
- [ ] All user-facing strings marked with `// TODO: i18n`
- [ ] No `console.log` in committed code
- [ ] No hardcoded secrets
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `progress_tracker.md` updated
