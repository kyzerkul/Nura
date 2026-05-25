# Feature Spec: 03 — Authentication

> **Phase**: 2 (Build)
> **Status**: pending
> **Depends on**: `02_supabase_setup` complete, migration SQL executed in Supabase dashboard

---

## Goal

Implement the full authentication flow: sign up, login, phone OTP, password reset, session persistence, and auth-gated routing. After this unit, unauthenticated users see auth screens; authenticated users land in the tab layout.

---

## Scope

### In scope

1. Auth state provider — listen to `onAuthStateChange`, expose session via React context
2. Auth-gated routing — `(auth)/` group for public screens, `(tabs)/` group for protected screens
3. Sign up screen (email + password + display name)
4. Login screen (email + password)
5. Phone OTP screen (enter phone → receive code → verify)
6. Forgot password screen (enter email → Supabase sends reset link)
7. Loading/splash state while session is being restored
8. Form validation (client-side, basic)
9. Error messages (user-friendly, no raw Supabase errors)
10. All UI text flagged with `// TODO: i18n`

### Out of scope

- Social auth (Google, Apple) — not in MVP
- Email verification enforcement (Supabase default: disabled, keep it off for MVP)
- Profile editing (spec 07)
- Onboarding flow after signup (spec 04)
- Deep link handling for password reset confirmation
- Biometric auth (Face ID, fingerprint)

---

## Files to create or modify

| Action | File | Purpose |
|---|---|---|
| **Create** | `src/providers/AuthProvider.tsx` | Auth context: session state, loading flag, sign-out helper |
| **Create** | `src/hooks/useSession.ts` | Convenience hook to consume AuthProvider |
| **Create** | `src/app/(auth)/_layout.tsx` | Stack layout for auth screens (no tabs) |
| **Create** | `src/app/(auth)/login.tsx` | Login screen (email + password) |
| **Create** | `src/app/(auth)/signup.tsx` | Sign up screen (email + password + display name) |
| **Create** | `src/app/(auth)/forgot-password.tsx` | Password reset request screen |
| **Create** | `src/app/(auth)/verify-otp.tsx` | Phone OTP entry + verification screen |
| **Create** | `src/app/(tabs)/_layout.tsx` | Bottom tab layout (4 tabs placeholder) |
| **Create** | `src/app/(tabs)/index.tsx` | Home tab placeholder (move design preview content here) |
| **Modify** | `src/app/_layout.tsx` | Wrap in AuthProvider, route based on session state |
| **Modify** | `src/app/index.tsx` | Session-based redirect entrypoint |

---

## Implementation details

### 1. AuthProvider (`src/providers/AuthProvider.tsx`)

Provides auth state to the entire app via React context.

```ts
type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};
```

Behavior:
- On mount, call `supabase.auth.getSession()` to restore persisted session
- Subscribe to `supabase.auth.onAuthStateChange()` to react to login/logout/token refresh
- `isLoading` is `true` until the first session check completes
- `signOut` calls `supabase.auth.signOut()` and clears the session
- Cleanup subscription on unmount

### 2. useSession hook (`src/hooks/useSession.ts`)

```ts
export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within AuthProvider');
  }
  return context;
}
```

### 3. Root layout modification (`src/app/_layout.tsx`)

- Wrap existing `ThemeProvider` + `Stack` inside `<AuthProvider>`
- While `isLoading` is true, show nothing (splash screen stays visible)
- When loaded, Expo Router handles group visibility based on redirects in each group layout

### 4. Auth group layout (`src/app/(auth)/_layout.tsx`)

- If a session exists, `<Redirect href="/(tabs)" />`
- Stack navigator with `headerShown: false`

### 5. Tabs group layout (`src/app/(tabs)/_layout.tsx`)

- If no session, `<Redirect href="/(auth)/login" />`
- Bottom tab bar with 4 tabs: Accueil, Chat, Journal, Moi
- Tab bar styling: `bg-background-card` background, terracotta active tint, muted inactive tint
- Only the Accueil (index) tab has content in this unit — others show placeholder screens

### 6. Login screen (`src/app/(auth)/login.tsx`)

Layout (top to bottom):
- Brand text "nura" (Caveat Brush, centered)
- Heading: "Bon retour" (// TODO: i18n)
- Email input (keyboard type: `email-address`, autoCapitalize: `none`)
- Password input (secureTextEntry: true)
- Primary button: "Se connecter" (// TODO: i18n)
- Text link: "Mot de passe oublié ?" → navigates to `forgot-password`
- Divider with "ou" (// TODO: i18n)
- Secondary button: "Connexion par téléphone" → navigates to `verify-otp`
- Bottom text: "Pas encore de compte ? S'inscrire" → navigates to `signup`

Auth call:
```ts
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

Error handling:
- "Invalid login credentials" → "Email ou mot de passe incorrect" (// TODO: i18n)
- Network error → "Connexion impossible. Vérifie ta connexion internet." (// TODO: i18n)

### 7. Sign up screen (`src/app/(auth)/signup.tsx`)

Layout:
- Brand text "nura"
- Heading: "Créer un compte" (// TODO: i18n)
- Display name input
- Email input
- Password input (minimum 6 characters, show requirement text)
- Primary button: "S'inscrire" (// TODO: i18n)
- Bottom text: "Déjà un compte ? Se connecter" → navigates to `login`

Auth call:
```ts
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { display_name: displayName } },
});
```

After successful signup:
- The `handle_new_user` trigger auto-creates the profile row
- Update the profile `display_name` via a separate Supabase query:
  ```ts
  await supabase.from('profiles').update({ display_name }).eq('id', user.id);
  ```
- Session is automatically established — `onAuthStateChange` fires, user gets redirected to `(tabs)`

Validation:
- Display name: required, 2–30 characters
- Email: required, basic format check
- Password: required, minimum 6 characters

### 8. Phone OTP screen (`src/app/(auth)/verify-otp.tsx`)

Two-step screen:

**Step 1 — Enter phone number**
- Phone number input (keyboard type: `phone-pad`)
- Primary button: "Envoyer le code" (// TODO: i18n)
- Call: `supabase.auth.signInWithOtp({ phone })`

**Step 2 — Enter verification code**
- 6-digit code input (keyboard type: `number-pad`)
- Primary button: "Vérifier" (// TODO: i18n)
- "Renvoyer le code" link (with 60-second cooldown timer)
- Call: `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`

On success → session established, redirect to `(tabs)`.

### 9. Forgot password screen (`src/app/(auth)/forgot-password.tsx`)

Layout:
- Back button (or text link) → navigates back to `login`
- Heading: "Réinitialiser le mot de passe" (// TODO: i18n)
- Description text: "Entre ton email, on t'enverra un lien." (// TODO: i18n)
- Email input
- Primary button: "Envoyer le lien" (// TODO: i18n)
- Success state: show confirmation text instead of form

Auth call:
```ts
const { error } = await supabase.auth.resetPasswordForEmail(email);
```

Note: the actual password reset happens via Supabase's hosted page (deep link handling is out of scope for MVP).

---

## Form validation rules

| Field | Rule | Error message (// TODO: i18n) |
|---|---|---|
| Email | Required, contains `@` and `.` | "Adresse email invalide" |
| Password | Required, ≥ 6 characters | "Le mot de passe doit contenir au moins 6 caractères" |
| Display name | Required, 2–30 characters | "Le nom doit contenir entre 2 et 30 caractères" |
| Phone | Required, starts with `+`, ≥ 10 digits | "Numéro de téléphone invalide" |
| OTP code | Required, exactly 6 digits | "Le code doit contenir 6 chiffres" |

---

## Error message mapping

Map Supabase error messages to user-friendly French text. Never show raw error strings.

| Supabase error (contains) | Display message (// TODO: i18n) |
|---|---|
| `Invalid login credentials` | "Email ou mot de passe incorrect" |
| `User already registered` | "Un compte existe déjà avec cet email" |
| `Email rate limit exceeded` | "Trop de tentatives. Réessaie dans quelques minutes." |
| `Phone number` / `OTP` error | "Code invalide ou expiré" |
| Network / unknown | "Une erreur est survenue. Réessaie." |

---

## Tab bar configuration (placeholder for spec 04+)

| Tab | Label | Icon (placeholder) | Screen |
|---|---|---|---|
| Accueil | Accueil | `house` | `(tabs)/index.tsx` |
| Chat | Chat | `message-circle` | `(tabs)/chat.tsx` (placeholder) |
| Journal | Journal | `book-open` | `(tabs)/journal.tsx` (placeholder) |
| Moi | Moi | `user` | `(tabs)/profile.tsx` (placeholder) |

Placeholder tab screens: show centered text with the tab name. These will be implemented in their respective specs.

---

## Security considerations

- Never log email, password, phone number, or OTP codes
- Password input uses `secureTextEntry`
- Auth tokens persisted in SecureStore (already configured in `supabase.ts`)
- No `service_role` key anywhere
- `signOut` clears the session from SecureStore
- Rate limiting is handled by Supabase (no client-side throttle needed, but show friendly message on rate limit errors)

---

## Checklist (must pass before marking complete)

- [ ] `AuthProvider` wraps the app and exposes `session`, `isLoading`, `signOut`
- [ ] `useSession` hook works from any component
- [ ] Unauthenticated users see `(auth)/login` — cannot access `(tabs)`
- [ ] Authenticated users see `(tabs)` — are redirected away from `(auth)`
- [ ] Login screen: email + password → signs in successfully
- [ ] Signup screen: email + password + display name → creates account, profile row created, display name saved
- [ ] Phone OTP screen: sends code, verifies code, establishes session
- [ ] Forgot password screen: sends reset email, shows confirmation
- [ ] Form validation prevents submission with invalid data
- [ ] Error messages are user-friendly (no raw Supabase errors shown)
- [ ] All user-facing strings marked with `// TODO: i18n`
- [ ] Tab layout shows 4 tabs with proper styling
- [ ] Loading state shown while session is being restored (splash screen)
- [ ] `signOut` clears session and returns to login
- [ ] No `console.log` in committed code
- [ ] No hardcoded secrets or test credentials
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `progress_tracker.md` updated
