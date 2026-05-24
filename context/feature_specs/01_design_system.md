# Feature Spec: 01 — Design System

> **Phase**: 2 (Build)
> **Status**: completed
> **Depends on**: Phase 1 complete (design tokens finalized in `ui_context.md`)

---

## Goal

Set up NativeWind v4, load custom fonts, define all design tokens in Tailwind config and `constants/colors.ts`, configure dark mode, and build the foundational UI primitives that every future screen depends on.

After this unit, any developer (or agent) can build screens using only token-based Tailwind classes — no raw hex values, no guessing.

---

## Scope

### In scope

1. Install and configure NativeWind v4 + Tailwind CSS
2. Load custom fonts: Plus Jakarta Sans (body), Caveat Brush (brand)
3. Replace `constants/theme.ts` with `constants/colors.ts` (token-based)
4. Configure `tailwind.config.js` with full color palette, font families, and spacing
5. Set up dark mode (system-based, with manual override ready)
6. Build base primitives: `Text`, `Button`, `Card`, `Avatar`, `Input`, `MoodPicker`, `TabBar`
7. Update `app/_layout.tsx` to load fonts and provide theme context
8. Update `app.json` splash/icon colors to match brand palette

### Out of scope

- Screen-level layouts (Accueil, Chat, Journal, etc.) — those are separate specs
- Supabase, analytics, or any backend integration
- i18n setup (noted with `// TODO: i18n` where strings appear)
- Caveat font (optional accent font — deferred, can add later)

---

## Dependencies to install

```bash
npx expo install nativewind tailwindcss@^3.4 postcss autoprefixer
npx expo install expo-font
npx expo install @expo/vector-icons
```

Note: `expo-font` is already in `package.json`. Check version compatibility with SDK 56.

---

## Files to create or modify

| Action | File | Purpose |
|---|---|---|
| **Create** | `tailwind.config.js` | Tailwind tokens: colors, fonts, spacing, border-radius |
| **Create** | `babel.config.js` | NativeWind Babel preset (if not already present) |
| **Create** | `metro.config.js` | NativeWind Metro integration (if not already present) |
| **Replace** | `src/constants/colors.ts` | Full color palette (light + dark), replacing `theme.ts` |
| **Create** | `src/constants/fonts.ts` | Font family constants and loading config |
| **Modify** | `src/global.css` | Tailwind directives (`@tailwind base/components/utilities`) |
| **Modify** | `src/app/_layout.tsx` | Font loading, NativeWind provider, theme provider |
| **Create** | `src/components/ui/Text.tsx` | Themed text with font variants |
| **Create** | `src/components/ui/Button.tsx` | Primary + secondary button |
| **Create** | `src/components/ui/Card.tsx` | Card container |
| **Create** | `src/components/ui/Avatar.tsx` | Companion + user avatar |
| **Create** | `src/components/ui/Input.tsx` | Text input (chat-ready) |
| **Create** | `src/components/ui/MoodPicker.tsx` | 5-emoji mood selector |
| **Modify** | `app.json` | Splash + icon background colors → brand palette |
| **Delete** | `src/constants/theme.ts` | Replaced by `colors.ts` |

---

## Implementation details

### 1. Tailwind config (`tailwind.config.js`)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#f0eee9',
          secondary: '#f5efe6',
          card: '#fbf7ef',
          elevated: '#fff8ef',
        },
        foreground: {
          DEFAULT: '#2a2520',
          secondary: '#5b5048',
          muted: '#9a8f85',
        },
        accent: {
          DEFAULT: '#c96442',
          dark: '#9a4528',
          soft: '#e8a98a',
          gold: '#d9a55a',
          blue: '#4a6b8a',
        },
        border: {
          DEFAULT: '#c7bba6',
          subtle: '#ede5d6',
        },
        companion: {
          bubble: '#fbf7ef',
          text: '#2a2520',
          avatar: '#c96442',
        },
        user: {
          bubble: '#c96442',
          text: '#ffffff',
          avatar: '#d9a55a',
        },
        // Dark mode overrides applied via CSS variables or class-based swap
        dark: {
          background: '#1e1814',
          'background-secondary': '#15110d',
          'background-card': '#2a221b',
          'background-elevated': '#2a2520',
          foreground: '#fff8ef',
          'foreground-secondary': '#c7bba6',
          'foreground-muted': '#8a7e6c',
        },
      },
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular', 'sans-serif'],
        'sans-medium': ['PlusJakartaSans_500Medium', 'sans-serif'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold', 'sans-serif'],
        'sans-bold': ['PlusJakartaSans_700Bold', 'sans-serif'],
        brand: ['CaveatBrush_400Regular', 'cursive'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'heading': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'subheading': ['18px', { lineHeight: '26px', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'button': ['16px', { lineHeight: '24px', fontWeight: '600' }],
      },
      borderRadius: {
        'card': '16px',
        'bubble': '20px',
        'button': '9999px',
        'avatar': '9999px',
        'input': '12px',
        'chip': '9999px',
      },
      spacing: {
        'safe-bottom': '34px',
      },
    },
  },
  plugins: [],
};
```

### 2. Color constants (`src/constants/colors.ts`)

Mirrors `tailwind.config.js` for use in imperative code (e.g., StatusBar, Reanimated).

Must export:
- `lightColors` object
- `darkColors` object
- `getColors(scheme: 'light' | 'dark')` helper

### 3. Font loading (`src/constants/fonts.ts`)

Google Fonts packages to install:
```bash
npx expo install @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/caveat-brush
```

Fonts to load:
- `PlusJakartaSans_400Regular`
- `PlusJakartaSans_500Medium`
- `PlusJakartaSans_600SemiBold`
- `PlusJakartaSans_700Bold`
- `CaveatBrush_400Regular`

Export a `fontsToLoad` map for use with `useFonts()` in `_layout.tsx`.

### 4. Root layout (`src/app/_layout.tsx`)

Must:
- Load fonts with `useFonts()` from `expo-font`
- Show splash screen until fonts are loaded (`expo-splash-screen`)
- Wrap app in NativeWind `cssInterop` / theme provider
- Detect system color scheme and apply dark/light class
- Keep `ThemeProvider` from Expo Router for navigation theming

### 5. `app.json` updates

```json
{
  "expo": {
    "splash": {
      "backgroundColor": "#f0eee9"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#f0eee9"
      }
    }
  }
}
```

### 6. Base components

All components use NativeWind `className` only. No inline `style` except for animated values.

#### `Text.tsx`
- Props: `variant` (`display` | `heading` | `subheading` | `body` | `caption` | `brand`), `className?`
- Default variant: `body`
- `brand` variant uses Caveat Brush font
- All other variants use Plus Jakarta Sans with appropriate weight

#### `Button.tsx`
- Props: `variant` (`primary` | `secondary`), `label`, `onPress`, `disabled?`, `loading?`, `className?`
- Primary: `bg-accent rounded-button text-white font-sans-semibold`
- Secondary: `bg-background-card border border-border rounded-button text-foreground font-sans-medium`
- Loading state: show `ActivityIndicator`
- Min height 48px for touch target

#### `Card.tsx`
- Props: `children`, `className?`
- Base: `bg-background-card rounded-card border border-border-subtle p-4`

#### `Avatar.tsx`
- Props: `type` (`companion` | `user`), `label` (initial letter or "n"), `size?` (`sm` | `md` | `lg`)
- Companion: terracotta circle, white text
- User: gold circle, white text
- Sizes: sm=32, md=40, lg=64

#### `Input.tsx`
- Props: `placeholder`, `value`, `onChangeText`, `multiline?`, `className?`
- Base: `bg-background-card border border-border rounded-input px-4 py-3 text-body font-sans`
- Placeholder color: `text-foreground-muted`

#### `MoodPicker.tsx`
- Props: `selected?` (0-4 index), `onSelect` callback
- 5 emoji states: 😞 😕 🙂 😊 😍
- Selected emoji scales up (Reanimated `withSpring`)
- Dashed circle border on unselected, solid on selected

---

## Checklist (must pass before marking complete)

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] NativeWind classes apply correctly on iOS and Android (verify via Expo Go or dev build)
- [ ] Plus Jakarta Sans renders in all 4 weights
- [ ] Caveat Brush renders for brand text
- [ ] Dark mode toggles correctly (system preference)
- [ ] All 6 base components render without errors
- [ ] No raw hex colors in any component file
- [ ] No `console.log` in committed code
- [ ] `constants/theme.ts` is deleted (replaced by `constants/colors.ts`)
- [ ] `app.json` splash/icon colors updated to `#f0eee9`
- [ ] `progress_tracker.md` updated

---

## Architectural notes

- NativeWind v4 requires `nativewind/preset` in Tailwind config and a Babel/Metro plugin. Follow the [NativeWind v4 Expo setup guide](https://www.nativewind.dev/v4/getting-started/expo-router) exactly.
- `expo-font` + `@expo-google-fonts/*` is the standard Expo way to load Google Fonts. No manual `.ttf` file management needed.
- Dark mode uses `class` strategy (not `media`) so we can add a manual toggle later in settings without reworking.
- Components go in `src/components/ui/` to separate design-system primitives from feature components.
