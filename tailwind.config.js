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
        status: {
          success: '#6b9a6b',
          error: '#c96442',
          warning: '#d9a55a',
        },
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
        sans: ['PlusJakartaSans_400Regular'],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        'sans-bold': ['PlusJakartaSans_700Bold'],
        brand: ['CaveatBrush_400Regular'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '40px' }],
        heading: ['24px', { lineHeight: '32px' }],
        subheading: ['18px', { lineHeight: '26px' }],
        body: ['16px', { lineHeight: '24px' }],
        caption: ['13px', { lineHeight: '18px' }],
        button: ['16px', { lineHeight: '24px' }],
      },
      borderRadius: {
        card: '16px',
        bubble: '20px',
        button: '9999px',
        avatar: '9999px',
        input: '12px',
        chip: '9999px',
      },
      spacing: {
        'safe-bottom': '34px',
      },
    },
  },
  plugins: [],
};
