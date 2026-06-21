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
        'space': {
          950: '#050A14',
          900: '#0A1628',
          800: '#111D35',
          700: '#1A2A47',
          600: '#243B5E',
        },
        'gold': {
          50: '#FDF8E8',
          100: '#F9EFC2',
          200: '#F3DE88',
          300: '#EBCB50',
          400: '#E2BC30',
          500: '#D4AF37',
          600: '#B89323',
          700: '#95751B',
        },
        'cine': {
          50: '#FCE8E6',
          100: '#F8C5BF',
          200: '#F0968C',
          300: '#E56657',
          400: '#D84736',
          500: '#C0392B',
          600: '#9B2A1E',
          700: '#771E15',
        },
        'chart': {
          green: '#10B981',
          orange: '#F59E0B',
          purple: '#8B5CF6',
          blue: '#3B82F6',
          pink: '#EC4899',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.25)',
        'glow-cine': '0 0 20px rgba(192, 57, 43, 0.25)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.25)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'space-gradient': 'radial-gradient(ellipse at top, #111D35 0%, #0A1628 50%, #050A14 100%)',
        'grid-pattern': "linear-gradient(rgba(212, 175, 55, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'refresh': 'refresh 2s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        refresh: {
          '0%': { opacity: '0.4', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.01)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
