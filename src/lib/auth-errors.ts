// TODO: i18n — all messages below
const ERROR_MAP: Array<{ pattern: string; message: string }> = [
  { pattern: 'Invalid login credentials', message: 'Email ou mot de passe incorrect' },
  { pattern: 'User already registered', message: 'Un compte existe déjà avec cet email' },
  { pattern: 'Email rate limit exceeded', message: 'Trop de tentatives. Réessaie dans quelques minutes.' },
  { pattern: 'rate limit', message: 'Trop de tentatives. Réessaie dans quelques minutes.' },
  { pattern: 'Phone', message: 'Code invalide ou expiré' },
  { pattern: 'OTP', message: 'Code invalide ou expiré' },
  { pattern: 'Token', message: 'Code invalide ou expiré' },
];

export function mapAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  for (const entry of ERROR_MAP) {
    if (lower.includes(entry.pattern.toLowerCase())) {
      return entry.message;
    }
  }
  if (__DEV__) return `[DEV] ${raw}`;
  return 'Une erreur est survenue. Réessaie.'; // TODO: i18n
}
