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
        primary: {
          50: '#E8EEF6',
          100: '#C5D4E8',
          200: '#8FA9D1',
          300: '#5A7EBA',
          400: '#3B6FA8',
          500: '#0A2E5C',
          600: '#092852',
          700: '#071F42',
          800: '#051732',
          900: '#030F22',
        },
        gold: {
          50: '#FBF6E8',
          100: '#F5E8C0',
          200: '#EBCF80',
          300: '#E0B640',
          400: '#D4A843',
          500: '#C49A35',
          600: '#A47D28',
          700: '#84611E',
          800: '#644614',
          900: '#442C0A',
        },
        sky: {
          DEFAULT: '#3B82F6',
        },
        emergency: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'typing': 'typing 1.5s steps(30) forwards',
        'breathe': 'breathe 2s ease-in-out infinite',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212,168,67,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(212,168,67,0.6)' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};
