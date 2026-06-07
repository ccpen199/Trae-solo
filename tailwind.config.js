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
        rose: {
          DEFAULT: '#E11D48',
          50: '#FDF2F4',
          100: '#FBE4E9',
          200: '#F7CBD6',
          300: '#F1A8B8',
          400: '#E97A92',
          500: '#E11D48',
          600: '#C41A3F',
          700: '#A31634',
          800: '#82122A',
          900: '#610D1F',
        },
        sprout: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warmgold: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'stagger-1': 'fadeInUp 0.5s ease-out 0.1s forwards',
        'stagger-2': 'fadeInUp 0.5s ease-out 0.2s forwards',
        'stagger-3': 'fadeInUp 0.5s ease-out 0.3s forwards',
        'stagger-4': 'fadeInUp 0.5s ease-out 0.4s forwards',
        'stagger-5': 'fadeInUp 0.5s ease-out 0.5s forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
