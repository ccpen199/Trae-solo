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
        primary: {
          50: '#E8ECF5',
          100: '#C5CFE5',
          200: '#9EB0D4',
          300: '#7791C3',
          400: '#5A78B6',
          500: '#3D5FA9',
          600: '#2A4785',
          700: '#1A3063',
          800: '#0A2463',
          900: '#051232',
        },
        accent: {
          up: '#E63946',
          down: '#2A9D8F',
          verified: '#D4AF37',
        },
        neutral: {
          900: '#1A1A2E',
          800: '#2D2D44',
          700: '#4A4A6A',
          50: '#F5F7FA',
        }
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'SimSun', 'serif'],
        sans: ['"Source Han Sans SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(10, 36, 99, 0.08)',
        'card-hover': '0 8px 30px rgba(10, 36, 99, 0.12)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
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
