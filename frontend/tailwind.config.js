/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme — futuristic AI SaaS
        dark: {
          bg: '#05070d',
          bgAlt: '#0a0e18',
          navy: '#0d1526',
          charcoal: '#12161f',
          glass: 'rgba(18, 22, 31, 0.6)',
          border: 'rgba(52, 211, 153, 0.15)',
        },
        emerald: {
          glow: '#34d399',
          soft: '#6ee7b7',
          deep: '#059669',
        },
        // Light theme — luxury camel & sage
        camel: {
          50: '#faf6f0',
          100: '#f3e9d8',
          200: '#e6d3b3',
          300: '#d6b585',
          400: '#c69c62',
          500: '#b8874a',
          600: '#9c6f3b',
          700: '#7d5730',
          800: '#5f4225',
          900: '#3e2b18',
        },
        sage: {
          50: '#f4f7f3',
          100: '#e5ede2',
          200: '#cbdac5',
          300: '#a9c19f',
          400: '#87a97a',
          500: '#6b9059',
          600: '#547345',
          700: '#425938',
          800: '#31422a',
          900: '#1f2b1a',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 24px 0 rgba(52, 211, 153, 0.25)',
        'glow-lg': '0 0 48px 0 rgba(52, 211, 153, 0.3)',
        luxury: '0 8px 30px rgba(94, 66, 37, 0.12)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-light': '0 4px 20px rgba(93, 79, 53, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 8s ease infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', boxShadow: '0 0 20px rgba(52,211,153,0.2)' },
          '50%': { opacity: '1', boxShadow: '0 0 40px rgba(52,211,153,0.5)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(52,211,153,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
