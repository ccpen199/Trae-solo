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
      screens: {
        '2xl': '1440px',
      }
    },
    extend: {
      colors: {
        'deep-blue': {
          50: '#f0f5fa',
          100: '#dce7f2',
          200: '#b7cfe5',
          300: '#85b0d2',
          400: '#4d89bc',
          500: '#2c6aa3',
          600: '#1d5386',
          700: '#18426c',
          800: '#15375a',
          900: '#0F2B46',
          950: '#0a1d2f',
        },
        'coral-orange': {
          50: '#fff2ee',
          100: '#ffe1d7',
          200: '#ffc0af',
          300: '#ff957d',
          400: '#ff6b4a',
          500: '#f74e2a',
          600: '#e43718',
          700: '#bf2913',
          800: '#9d2516',
          900: '#822419',
        },
        'gold-foil': {
          50: '#fbf7eb',
          100: '#f5edc9',
          200: '#ebd989',
          300: '#e1c352',
          400: '#D4AF37',
          500: '#c69622',
          600: '#a9731a',
          700: '#875419',
          800: '#71431c',
          900: '#60381d',
        },
        'graphite': {
          50: '#f7f8f9',
          100: '#eceef0',
          200: '#d6dade',
          300: '#b3bac2',
          400: '#8a94a1',
          500: '#718096',
          600: '#4a5568',
          700: '#2D3748',
          800: '#1f2733',
          900: '#171e29',
        },
        'cloud': {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f5f5f5',
          300: '#ededed',
        }
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'body': ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'floating': '0 8px 32px rgba(15, 43, 70, 0.12)',
        'hover': '0 12px 40px rgba(15, 43, 70, 0.16)',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'elegant': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-to)',
      },
    },
  },
  plugins: [],
};
