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
        // runtime via CSS variables (per-business color choices)
        brand: {
          DEFAULT: 'var(--brand)',
          light: 'var(--brand-light)',
          dark: 'var(--brand-dark)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          light: 'var(--secondary-light)',
          dark: 'var(--secondary-dark)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          light: 'var(--tertiary-light)',
          dark: 'var(--tertiary-dark)',
        },
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
