/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B1A',
          red: '#FF2D00',
          amber: '#FFB347',
        },
      },
      animation: {
        'flame-float': 'flameFloat 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'pulse-slow-delay': 'pulseSlow 4s ease-in-out infinite 2s',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        flameFloat: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-12px) scale(1.03)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%': { opacity: '0.25', transform: 'scale(1.1)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
