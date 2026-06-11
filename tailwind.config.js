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
        navy: {
          50: '#E8EBF0',
          100: '#C5CCD9',
          200: '#9EABBF',
          300: '#778AA4',
          400: '#59708F',
          500: '#3B5779',
          600: '#2E4562',
          700: '#1B2A4A',
          800: '#141F38',
          900: '#0D1526',
        },
        amber: {
          50: '#FDF8EE',
          100: '#F9EDCF',
          200: '#F2D89E',
          300: '#E8BF65',
          400: '#D4A853',
          500: '#C49238',
          600: '#A6742C',
          700: '#855824',
          800: '#6B4520',
          900: '#57381D',
        },
        teal: {
          50: '#E6F5F5',
          100: '#C0E8E8',
          200: '#96D8D8',
          300: '#6BC7C7',
          400: '#4BB8B8',
          500: '#2E8B8B',
          600: '#257575',
          700: '#1C5E5E',
          800: '#154A4A',
          900: '#0F3838',
        },
        surface: {
          DEFAULT: '#F5F6FA',
          card: '#FFFFFF',
          dark: '#1B2A4A',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'count-up': 'countUp 1.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
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
      },
    },
  },
  plugins: [],
};
