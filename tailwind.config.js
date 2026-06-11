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
          50: '#E8EDF2',
          100: '#C5D1DE',
          200: '#8FA3BC',
          300: '#59759A',
          400: '#2E5078',
          500: '#0F2B46',
          600: '#0C2339',
          700: '#091A2C',
          800: '#06121F',
          900: '#030A12',
        },
        amber: {
          50: '#FDF8ED',
          100: '#FAECC5',
          200: '#F5D98B',
          300: '#EFC451',
          400: '#D4A853',
          500: '#C49A3D',
          600: '#A37D2E',
          700: '#7F5F22',
          800: '#5C4318',
          900: '#3A2B0F',
        },
        ivory: '#FAFAF5',
        graphite: '#2D3436',
        emerald: '#00B894',
        coral: '#E17055',
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Noto Serif SC"', 'serif'],
        body: ['"DM Sans"', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'score-count': 'scoreCount 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scoreCount: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
