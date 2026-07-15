/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#161513',
        paper: '#FAF9F6',
        stone: '#8C8578',
        // 'brand' (primary), 'secondary', and 'tertiary' are set at
        // runtime via CSS variables (per-business color choices).
        // Using rgb(var(--x) / <alpha-value>) — not a bare var(--x) — is
        // required for Tailwind opacity modifiers (bg-brand/10, etc.) to
        // actually generate CSS; a plain var() reference can't have alpha
        // applied to it. --brand etc. are defined in index.css as
        // space-separated RGB channels (e.g. "181 80 47"), not hex.
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          light: 'rgb(var(--brand-light) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          light: 'rgb(var(--secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--secondary-dark) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--tertiary) / <alpha-value>)',
          light: 'rgb(var(--tertiary-light) / <alpha-value>)',
          dark: 'rgb(var(--tertiary-dark) / <alpha-value>)',
        },
        // Page-surface tokens that respond to dark mode (see index.css's
        // `.dark` class and businessContext.jsx). Public site components
        // should use these instead of bg-paper/text-ink/bg-white for
        // anything that should adapt — admin panels intentionally keep
        // using paper/ink/white directly, since they never go dark.
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          card: 'rgb(var(--surface-card) / <alpha-value>)',
        },
        'on-surface': 'rgb(var(--on-surface) / <alpha-value>)',
      },
      fontFamily: {
        // Also runtime-driven — per-business heading/body font pairing
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        underline: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        underline: 'underline 0.6s cubic-bezier(0.65,0,0.35,1) forwards',
      },
    },
  },
  plugins: [],
}
