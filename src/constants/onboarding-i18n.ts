type Lang = 'fr' | 'en';

const strings = {
  welcome: {
    tagline: { fr: 'Ta confidente numérique', en: 'Your digital confidante' },
    feature1: { fr: 'Une écoute sincère, sans jugement', en: 'Genuine listening, without judgment' },
    feature2: { fr: 'Tes conversations restent privées', en: 'Your conversations stay private' },
    feature3: { fr: 'Elle prend de tes nouvelles', en: 'She checks in on you' },
    cta: { fr: 'Commencer', en: 'Get started' },
  },
  language: {
    heading: { fr: 'Tu préfères parler en…', en: 'You prefer to speak in…' },
    next: { fr: 'Suivant', en: 'Next' },
    back: { fr: '← Retour', en: '← Back' },
  },
  companion: {
    heading: { fr: 'Choisis ta confidente', en: 'Choose your companion' },
    subheading: { fr: 'Tu pourras changer plus tard', en: 'You can change later' },
    chooseName: { fr: 'Choisir', en: 'Choose' },
    choosePrompt: { fr: 'Choisis une confidente', en: 'Choose a companion' },
    back: { fr: '← Retour', en: '← Back' },
  },
  ready: {
    heading: { fr: 'Prête à commencer ?', en: 'Ready to start?' },
    description: {
      fr: (name: string) => `${name} est là pour toi. Parle-lui de ce que tu veux, quand tu veux.`,
      en: (name: string) => `${name} is here for you. Talk to her about anything, anytime.`,
    },
    privacy: {
      fr: 'Tes conversations sont privées et sécurisées 🔒',
      en: 'Your conversations are private and secure 🔒',
    },
    cta: { fr: 'Commencer à parler', en: 'Start talking' },
    back: { fr: '← Retour', en: '← Back' },
  },
} as const;

export function t(lang: Lang | string | undefined) {
  const l: Lang = lang === 'en' ? 'en' : 'fr';
  return {
    welcome: {
      tagline: strings.welcome.tagline[l],
      feature1: strings.welcome.feature1[l],
      feature2: strings.welcome.feature2[l],
      feature3: strings.welcome.feature3[l],
      cta: strings.welcome.cta[l],
    },
    language: {
      heading: strings.language.heading[l],
      next: strings.language.next[l],
      back: strings.language.back[l],
    },
    companion: {
      heading: strings.companion.heading[l],
      subheading: strings.companion.subheading[l],
      chooseName: strings.companion.chooseName[l],
      choosePrompt: strings.companion.choosePrompt[l],
      back: strings.companion.back[l],
    },
    ready: {
      heading: strings.ready.heading[l],
      description: strings.ready.description[l],
      privacy: strings.ready.privacy[l],
      cta: strings.ready.cta[l],
      back: strings.ready.back[l],
    },
    lang: l,
  };
}
