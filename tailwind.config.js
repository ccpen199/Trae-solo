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
        'finance': {
          900: '#061229',
          800: '#0B1E3F',
          700: '#132B55',
          600: '#1B3A70',
          500: '#254B8E',
        },
        'gold': {
          50: '#FBF7EC',
          100: '#F5ECCE',
          200: '#EAD69C',
          300: '#DEC06A',
          400: '#D4AF42',
          500: '#C9A962',
          600: '#B8932E',
          700: '#977725',
          800: '#765C1C',
          900: '#554113',
        },
        'signal': {
          positive: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          neutral: '#64748B',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Source Han Sans SC"', '"PingFang SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 0 20px rgba(201, 169, 98, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 169, 98, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(201, 169, 98, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
};
