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
          50: '#FFF3ED',
          100: '#FFE4D4',
          200: '#FFC5A8',
          300: '#FF9E71',
          400: '#FF6B35',
          500: '#FF5715',
          600: '#E63F08',
          700: '#BF3009',
          800: '#98270F',
          900: '#7A230F',
        },
        teal: {
          50: '#E8F4F5',
          100: '#D1E9EB',
          200: '#A3D3D7',
          300: '#75BDC3',
          400: '#4DA7AE',
          500: '#1A535C',
          600: '#164B53',
          700: '#123C43',
          800: '#0E2D33',
          900: '#0A1E24',
        },
        gold: {
          50: '#FFF9E6',
          100: '#FFF0BF',
          200: '#FFE699',
          300: '#FFD166',
          400: '#FFC233',
          500: '#FFB000',
          600: '#CC8D00',
          700: '#996A00',
          800: '#664700',
          900: '#332400',
        },
        danger: {
          50: '#FDE8ED',
          100: '#FBD1DB',
          200: '#F7A3B7',
          300: '#F37593',
          400: '#EF476F',
          500: '#E8265A',
          600: '#C41D4A',
          700: '#9E153B',
          800: '#780E2D',
          900: '#52071E',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scroll-left': 'scrollLeft 30s linear infinite',
        'count-up': 'countUp 1s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scrollLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        countUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
