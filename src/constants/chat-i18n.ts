type Lang = 'fr' | 'en';

const strings = {
  header: {
    subtitle: { fr: 'Toujours là pour toi', en: 'Always here for you' },
  },
  input: {
    placeholder: { fr: 'Écris ton message…', en: 'Write your message…' },
    sendLabel: { fr: 'Envoyer', en: 'Send' },
  },
  suggestions: {
    starter1: { fr: 'Raconte-moi ta journée', en: 'Ask me about my day' },
    starter2: { fr: 'J\'ai besoin de parler', en: 'I need to talk' },
    starter3: { fr: 'Donne-moi un boost', en: 'Give me a boost' },
  },
  errors: {
    sendFailed: {
      fr: 'Ton message n\'a pas pu être envoyé. Vérifie ta connexion.',
      en: 'Your message couldn\'t be sent. Check your connection.',
    },
    replyFailed: {
      fr: 'La réponse n\'a pas pu arriver. Réessaie dans un instant.',
      en: 'The reply couldn\'t come through. Try again in a moment.',
    },
    loadFailed: {
      fr: 'Impossible de charger la conversation.',
      en: 'Couldn\'t load the conversation.',
    },
    retry: { fr: 'Réessayer', en: 'Retry' },
  },
  empty: {
    noCompanion: {
      fr: 'Ta confidente t\'attend — termine d\'abord ton inscription.',
      en: 'Your companion is waiting — finish setting up your account first.',
    },
  },
} as const;

export function tChat(lang: Lang | string | undefined) {
  const l: Lang = lang === 'en' ? 'en' : 'fr';
  return {
    header: {
      subtitle: strings.header.subtitle[l],
    },
    input: {
      placeholder: strings.input.placeholder[l],
      sendLabel: strings.input.sendLabel[l],
    },
    suggestions: [
      strings.suggestions.starter1[l],
      strings.suggestions.starter2[l],
      strings.suggestions.starter3[l],
    ],
    errors: {
      sendFailed: strings.errors.sendFailed[l],
      replyFailed: strings.errors.replyFailed[l],
      loadFailed: strings.errors.loadFailed[l],
      retry: strings.errors.retry[l],
    },
    empty: {
      noCompanion: strings.empty.noCompanion[l],
    },
    lang: l,
  };
}
