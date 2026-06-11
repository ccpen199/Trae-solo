/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        'justice': {
          50: '#E8EFF7',
          100: '#D1DFEE',
          200: '#A3BFD8',
          300: '#759EC2',
          400: '#477EAC',
          500: '#0F4C81',
          600: '#0D4270',
          700: '#0A3355',
          800: '#082540',
          900: '#05162A',
        },
        'scale': {
          50: '#FBF8F1',
          100: '#F7F0E2',
          200: '#EFE1C5',
          300: '#E7D2A8',
          400: '#DFC38B',
          500: '#C9A962',
          600: '#B09148',
          700: '#897037',
          800: '#624F26',
          900: '#3B2F15',
        },
        'alert': {
          50: '#FBEAE9',
          100: '#F6D5D2',
          200: '#EDACA5',
          300: '#E48278',
          400: '#DB584B',
          500: '#C0392B',
          600: '#A23024',
          700: '#7A241B',
          800: '#511812',
          900: '#290C09',
        },
        '公益': {
          50: '#E8F6EE',
          100: '#D1EDDD',
          200: '#A3DBBB',
          300: '#75C999',
          400: '#47B777',
          500: '#27AE60',
          600: '#219452',
          700: '#196F3D',
          800: '#114A29',
          900: '#092514',
        },
        'graphite': {
          50: '#F8F9FA',
          100: '#ECF0F1',
          200: '#D5DBDB',
          300: '#BDC3C7',
          400: '#7F8C8D',
          500: '#2C3E50',
          600: '#253544',
          700: '#1C2833',
          800: '#141B22',
          900: '#0A0E11',
        }
      },
      fontFamily: {
        'serif': ['"Noto Serif SC"', 'Georgia', 'serif'],
        'sans': ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(15, 76, 129, 0.08)',
        'card-hover': '0 8px 32px rgba(15, 76, 129, 0.15)',
        'glow': '0 0 20px rgba(15, 76, 129, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0F4C81 0%, #0A3355 50%, #05162A 100%)',
        'card-gradient': 'linear-gradient(135deg, #ffffff 0%, #F8F9FA 100%)',
      }
    },
  },
  plugins: [],
};
