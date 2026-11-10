import type { Config } from 'tailwindcss';

/**
 * Sistema de diseño Candela Commerce.
 *
 * Los colores se declaran como variables CSS para que cada tenant pueda
 * sobrescribir su paleta en runtime (stores.theme) sin recompilar nada.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
          mute: 'rgb(var(--c-ink-mute) / <alpha-value>)',
        },
        cream: {
          DEFAULT: 'rgb(var(--c-cream) / <alpha-value>)',
          deep: 'rgb(var(--c-cream-deep) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--c-gold) / <alpha-value>)',
          light: 'rgb(var(--c-gold-light) / <alpha-value>)',
          deep: 'rgb(var(--c-gold-deep) / <alpha-value>)',
        },
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        brand: '0.28em',
        wideish: '0.16em',
      },
      boxShadow: {
        card: '0 1px 2px rgb(23 18 16 / 0.04), 0 8px 24px -12px rgb(23 18 16 / 0.18)',
        lift: '0 2px 4px rgb(23 18 16 / 0.05), 0 18px 40px -16px rgb(23 18 16 / 0.28)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
