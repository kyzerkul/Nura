# Nura — Code Standards

## TypeScript

- Strict mode enabled in `tsconfig.json` — no exceptions
- No `any` type. Use `unknown` and narrow it, or define a proper type
- All props interfaces are defined inline or in `types/`
- Prefer `type` over `interface` for plain data shapes; `interface` for extensible contracts
- Use `satisfies` when assigning objects to enforce shape without widening

```ts
// Good
type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
};

// Bad
const msg: any = { ... };
```

---

## React Native / Expo conventions

- Use **Expo Router** file-based routing. Never use `react-navigation` directly.
- Screen files live in `app/`. Reusable components live in `components/`.
- Use `expo-constants` for environment-agnostic config, never hardcode URLs
- Never use `Platform.OS === 'ios'` for business logic — only for styling exceptions
- Use `useCallback` and `useMemo` only when a measurable performance benefit exists. Don't wrap everything.
- Avoid `useEffect` for data fetching — use React Query or Supabase's real-time subscriptions

---

## Supabase client

There are two Supabase client contexts:

1. **Client-side** (`lib/supabase.ts`) — uses the `anon` key. Safe to be in the app bundle.
2. **Server-side** (Edge Functions / Trigger.dev) — uses the `service_role` key. NEVER in the app bundle.

```ts
// lib/supabase.ts — client only
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

export const supabase = createClient(
  Constants.expoConfig!.extra!.supabaseUrl,
  Constants.expoConfig!.extra!.supabaseAnonKey
);
```

---

## NativeWind / Tailwind

- All colors come from the design tokens defined in `tailwind.config.js` and `constants/colors.ts`
- No hardcoded hex colors inline (no `style={{ color: '#ff0000' }}`)
- Use `className` for NativeWind. Use `style` only for dynamic values that can't be expressed as utilities (e.g., animated transforms)
- Keep class strings readable — break into variables if a component has more than 6 classes

```tsx
// Good
const containerClass = 'flex-1 bg-background px-4 py-6';
<View className={containerClass}>

// Bad
<View style={{ backgroundColor: '#1a1a2e', padding: 16 }}>
```

---

## API calls to Edge Functions

All AI-related calls go through `lib/api.ts`. Never call OpenRouter directly from a component.

```ts
// lib/api.ts
export async function sendChatMessage(messages: Message[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { messages },
  });
  if (error) throw new Error(error.message);
  return data.content;
}
```

---

## Error handling

- All `async` functions that call external services must be wrapped in `try/catch`
- Surface errors to the user with a friendly message — never expose raw error strings from Supabase or OpenRouter to the UI
- Log errors with `console.error` in development only — never in production (use a future error tracking service)

---

## File naming

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `ChatBubble.tsx` |
| Hooks | camelCase with `use` prefix | `useConversation.ts` |
| Utility functions | camelCase | `formatDate.ts` |
| Types | PascalCase | `Message`, `UserProfile` |
| Constants | SCREAMING_SNAKE_CASE for values, camelCase for objects | `MAX_MESSAGES = 20` |
| Supabase table names | snake_case | `conversation_messages` |

---

## Commit style

Use conventional commits:
```
feat: add proactive notification scheduler
fix: correct message ordering in chat list
chore: update Expo SDK to 52.1
```

One concern per commit. Never commit commented-out code.

---

## What NOT to do

- No `console.log` left in committed code (use a debug flag or remove)
- No hardcoded user IDs, API keys, or URLs in source code
- No TODOs left in code without a linked issue
- No duplicate Supabase queries — use hooks or shared data fetching layers
- No business logic in UI components — extract to hooks or `lib/`
