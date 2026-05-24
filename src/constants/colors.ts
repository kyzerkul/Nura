export const lightColors = {
  background: {
    primary: '#f0eee9',
    secondary: '#f5efe6',
    card: '#fbf7ef',
    elevated: '#fff8ef',
  },
  text: {
    primary: '#2a2520',
    secondary: '#5b5048',
    muted: '#9a8f85',
  },
  accent: {
    primary: '#c96442',
    primaryDark: '#9a4528',
    secondary: '#d9a55a',
    tertiary: '#4a6b8a',
    soft: '#e8a98a',
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
  border: {
    default: '#c7bba6',
    subtle: '#ede5d6',
  },
  status: {
    success: '#6b9a6b',
    error: '#c96442',
    warning: '#d9a55a',
  },
} as const;

export const darkColors = {
  background: {
    primary: '#1e1814',
    secondary: '#15110d',
    card: '#2a221b',
    elevated: '#2a2520',
  },
  text: {
    primary: '#fff8ef',
    secondary: '#c7bba6',
    muted: '#8a7e6c',
  },
  accent: {
    primary: '#c96442',
    primaryDark: '#9a4528',
    secondary: '#d9a55a',
    tertiary: '#4a6b8a',
    soft: '#e8a98a',
  },
  companion: {
    bubble: '#2a221b',
    text: '#fff8ef',
    avatar: '#c96442',
  },
  user: {
    bubble: '#c96442',
    text: '#ffffff',
    avatar: '#d9a55a',
  },
  border: {
    default: '#3a3228',
    subtle: '#2a221b',
  },
  status: {
    success: '#6b9a6b',
    error: '#c96442',
    warning: '#d9a55a',
  },
} as const;

export type ColorScheme = 'light' | 'dark';

export function getColors(scheme: ColorScheme) {
  return scheme === 'dark' ? darkColors : lightColors;
}
