/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      colors: {
        terracotta: {
          50: '#FBF4F1',
          100: '#F5E3DC',
          200: '#E9C3B6',
          300: '#DDA38F',
          400: '#D27D63',
          500: '#C8553D',
          600: '#A4422E',
          700: '#7D3223',
          800: '#572118',
          900: '#2E110D',
        },
        spruce: {
          50: '#EFF5F1',
          100: '#D3E6D8',
          200: '#A8D0B1',
          300: '#7CBA8A',
          400: '#55A367',
          500: '#2D6A4F',
          600: '#255842',
          700: '#1D4434',
          800: '#143025',
          900: '#0B1C16',
        },
        sand: {
          50: '#FDF8ED',
          100: '#FAEFD0',
          200: '#F4DFA1',
          300: '#ECCF72',
          400: '#E0BC4B',
          500: '#D4A843',
          600: '#B28C36',
          700: '#8B6E2A',
          800: '#614F1E',
          900: '#362C11',
        },
        ash: {
          50: '#F6F6F7',
          100: '#E5E6E7',
          200: '#CACCCE',
          300: '#AFB1B4',
          400: '#8E9296',
          500: '#4A4E53',
          600: '#3E4145',
          700: '#2E3033',
          800: '#1F2022',
          900: '#0F1011',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'elevated': '0 10px 40px -10px rgba(200, 85, 61, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
