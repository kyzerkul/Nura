# Nura — UI Context

> **Status: ACTIVE** — Design tokens finalized (2026-05-24).
> All fonts confirmed: Plus Jakarta Sans (body/UI), Caveat Brush (brand/display).

---

## Design direction

- **Feeling**: Warm, safe, intimate — not clinical, not robotic, not generic
- **Cultural lens**: Designed for Africa. Warmth, color choices, and references should feel local
- **Modes**: Light and Dark mode supported
- **Typography**: Readable at all sizes, supports French accents and Latin Extended (é, è, ê, ï, ç, à)
- **Iconography**: Rounded, friendly — no sharp/aggressive icons
- **Overall aesthetic**: Earthy tones, terracotta + beige + gold. Sketchy/organic feel in branding, clean in UI

---

## Color palette

### Light mode

```ts
// constants/colors.ts
export const colors = {
  background: {
    primary: '#f0eee9',    // Warm beige — main app background
    secondary: '#f5efe6',  // Slightly warmer — section backgrounds
    card: '#fbf7ef',       // Warm white — cards, bubbles, inputs
    elevated: '#fff8ef',   // Lightest — modals, overlays
  },
  text: {
    primary: '#2a2520',    // Dark brown — headings, body
    secondary: '#5b5048',  // Medium brown — subheadings, descriptions
    muted: '#9a8f85',      // Light brown — placeholders, timestamps, annotations
  },
  accent: {
    primary: '#c96442',    // Terracotta — brand color, CTAs, user bubbles
    primaryDark: '#9a4528', // Dark terracotta — pressed states, emphasis
    secondary: '#d9a55a',  // Gold / moutarde — avatars, badges, highlights
    tertiary: '#4a6b8a',   // Soft blue — secondary actions, links
    soft: '#e8a98a',       // Light terracotta — hover, subtle highlights
  },
  companion: {
    bubble: '#fbf7ef',     // Warm white — AI message bubble background
    text: '#2a2520',       // Dark brown — AI message text
    avatar: '#c96442',     // Terracotta circle with white "n"
  },
  user: {
    bubble: '#c96442',     // Terracotta — user message bubble
    text: '#ffffff',       // White — user message text
    avatar: '#d9a55a',     // Gold circle with initial
  },
  border: {
    default: '#c7bba6',    // Warm light brown — card borders, dividers
    subtle: '#ede5d6',     // Very light — subtle separators
  },
  status: {
    success: '#6b9a6b',    // Muted green
    error: '#c96442',      // Terracotta (reuses brand)
    warning: '#d9a55a',    // Gold (reuses secondary)
  },
};
```

### Dark mode

```ts
export const darkColors = {
  background: {
    primary: '#1e1814',    // Dark warm brown
    secondary: '#15110d',  // Deeper brown
    card: '#2a221b',       // Card surface
    elevated: '#2a2520',   // Modals
  },
  text: {
    primary: '#fff8ef',    // Warm white
    secondary: '#c7bba6',  // Muted warm
    muted: '#8a7e6c',      // Dimmed
  },
  // Accents remain the same in dark mode
};
```

---

## Typography

### Wireframe fonts (low-fi reference only — not for production)

| Role | Font | Style |
|---|---|---|
| Titles / brand "nura" | Caveat Brush | Script brush, bold, expressive |
| Body / UI text | Patrick Hand | Handwritten, readable, "notebook" |
| Annotations / secondary | Caveat (500, 700) | Cursive fine, margin notes |
| Fallback | Kalam (400, 700) | Handwritten Latin Extended |

### Production fonts

| Role | Font | Decision |
|---|---|---|
| **Brand / display** | Caveat Brush | Confirmed — "nura" logo text and display moments |
| **Body / UI** | Plus Jakarta Sans | Confirmed — all body text, buttons, labels, navigation |
| **Accent / intimate** | Caveat (optional) | May keep for journal prompts, annotations |

### Type scale (placeholder — finalize with body font)

| Token | Size | Weight | Usage |
|---|---|---|---|
| `display` | 28-32px | Bold | Screen titles ("Bonjour Aïcha") |
| `heading` | 22-24px | SemiBold | Section headers |
| `subheading` | 16-18px | Medium | Card titles, labels |
| `body` | 15-16px | Regular | Chat messages, descriptions |
| `caption` | 12-13px | Regular | Timestamps, annotations, muted text |
| `button` | 15-16px | SemiBold | CTA labels |

- **Line height**: generous (1.5× minimum for readability)

---

## Styling engine

- **NativeWind v4** — Tailwind CSS for React Native
- Tokens defined in `tailwind.config.js` and mirrored in `constants/colors.ts`
- All color references use token names, never raw hex values in component code

---

## Screen decisions (from wireframes)

| Screen | Variant chosen | Key elements |
|---|---|---|
| **Accueil** | B — Dashboard du jour | Greeting + cycle day, mood picker (5 emojis), daily intention card, "nura te propose" suggestions, 2 CTAs (Parler à nura / Mon journal) |
| **Chat** | B — Suggestions + cartes | Header with avatar + "nura" + subtitle, companion/user bubbles, inline action cards (rituel, respiration), quick-reply chips at bottom, input bar |
| **Journal** | B — Calendrier + tendances | Week calendar strip, 7-day trend graph, category filter chips (tout/humeur/cycle/gratitude/rêves), scrollable entry history |
| **Profil (Moi)** | B — Identité + pétales | Avatar + name + bio, stats row (jours/entrées/série/humeur), pétales badges (gamification), COMPTE section, APPLICATION section |
| **Onboarding Bienvenue** | B — Value prop riche | Logo + illustration placeholder, "Ta confidente numérique", 3 feature bullets (écoute, suivi cycle, rituels), CTA "Créer mon compte" |
| **Onboarding Personnalisation** | A — Wizard (question par question) | Step indicator (2/4), one question per screen, back/next nav, reassurance text |

---

## Navigation

- **Bottom tab bar**: 4 tabs — Accueil, Chat, Journal, Moi
- Active tab: terracotta text + icon
- Inactive tab: muted brown text + icon
- Tab bar background: card color (`#fbf7ef`) with subtle top border

---

## Component conventions

| Component | Style | Notes |
|---|---|---|
| **ChatBubble (companion)** | `bg-card rounded-2xl` left-aligned | Warm white bg, dark brown text, avatar left |
| **ChatBubble (user)** | `bg-accent-primary rounded-2xl` right-aligned | Terracotta bg, white text, avatar right |
| **ActionCard (chat)** | `bg-card border rounded-xl` | Icon + title + description, inline in chat flow |
| **QuickReplyChip** | `border rounded-full px-3 py-1` | Outlined pills at bottom of chat, terracotta accent on primary chip |
| **CompanionAvatar** | Terracotta circle, white "n" | 32-40px, used in chat header and bubbles |
| **UserAvatar** | Gold circle, white initial | 32-40px |
| **PrimaryButton** | `bg-accent-primary rounded-full text-white` | Full-width CTA, generous padding |
| **SecondaryButton** | `bg-card border rounded-full` | Outlined, brown text |
| **TextInput** | `bg-card border rounded-xl` | Warm white bg, brown placeholder |
| **MoodPicker** | 5 emojis in a row, dashed circle borders | Selectable, scales up on selection |
| **StatsRow** | Horizontal cards with number + label | Bordered, compact |
| **PétalesBadge** | Circle with icon + label below | Gamification badges on profile |
| **IntentionCard** | `bg-accent-primary/10 rounded-xl` | Soft terracotta bg, quoted text |
| **WeekCalendar** | 7-day strip with emoji per day | Current day highlighted with border |
| **TrendGraph** | Line chart, 7 days | Terracotta line, muted grid |
| **FilterChip** | `rounded-full` | Active: filled terracotta. Inactive: outlined |
| **JournalEntry** | `bg-card rounded-xl` | Date + emoji + text excerpt + tags |
| **OnboardingStep** | Full-screen, one question, progress dots | Back link + step counter |

---

## Screen layout rules (mobile)

- Bottom safe area padding on all screens with tab bar or fixed bottom element
- Top safe area for screens with custom header
- Horizontal padding: `px-4` (16pt) on all content screens
- Chat bubbles: max-width ~80%, padding 12pt inside
- Cards: 12-16pt internal padding, 8-12pt gap between cards

---

## Animation principles

- Messages animate in with subtle fade + slide-up (16pt travel, 200ms)
- Loading indicator on AI response: animated typing dots (3 dots)
- Screen transitions: Expo Router defaults (no custom transitions in MVP)
- Mood emoji: scale-up on selection (1.0 → 1.2, 150ms ease-out)
- Keep animations under 300ms — fast feels responsive on low-end Android devices
