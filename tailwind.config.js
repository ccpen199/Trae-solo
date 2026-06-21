/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ccb: {
          50: '#E8F0FE',
          100: '#C5D9FC',
          200: '#8FB3F9',
          300: '#5A8DF6',
          400: '#2567F3',
          500: '#003DA5',
          600: '#003590',
          700: '#002D7B',
          800: '#002466',
          900: '#001C51',
        },
        gold: {
          50: '#FDF8ED',
          100: '#F9EDCC',
          200: '#F3DB99',
          300: '#EDC966',
          400: '#E7B733',
          500: '#C9A96E',
          600: '#A88B4D',
          700: '#876D3C',
          800: '#664F2B',
          900: '#45311A',
        },
        space: {
          50: '#F0F1F5',
          100: '#D8DAE3',
          200: '#B1B4C7',
          300: '#8A8EAB',
          400: '#63688F',
          500: '#3C4273',
          600: '#302F5C',
          700: '#241E45',
          800: '#1A1A2E',
          900: '#0F0F17',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'stamp': 'stamp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 169, 110, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(201, 169, 110, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        stamp: {
          '0%': { opacity: '0', transform: 'scale(2) rotate(-15deg)' },
          '60%': { opacity: '1', transform: 'scale(0.95) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
