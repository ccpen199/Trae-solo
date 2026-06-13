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
          100: '#C6D3E5',
          200: '#9FB3CF',
          300: '#7893B9',
          400: '#5A78A8',
          500: '#3D5D97',
          600: '#2E4A80',
          700: '#1E3A5F',
          800: '#162C48',
          900: '#0F1E31',
        },
        gold: {
          50: '#FBF6EC',
          100: '#F4E7C9',
          200: '#ECD6A3',
          300: '#E4C57D',
          400: '#DCB75F',
          500: '#D4A853',
          600: '#B88F3E',
          700: '#9A7431',
          800: '#7C5C26',
          900: '#5E451C',
        },
        success: {
          500: '#059669',
          600: '#047857',
        },
        danger: {
          500: '#EF4444',
          600: '#DC2626',
        },
        info: {
          500: '#0EA5E9',
          600: '#0284C7',
        },
        warn: {
          500: '#F59E0B',
          600: '#D97706',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1F2937',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['"Source Han Sans CN"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        serif: ['"Source Han Serif CN"', '"Noto Serif SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px rgba(30, 58, 95, 0.12), 0 4px 10px rgba(30, 58, 95, 0.06)',
        'gold-glow': '0 0 20px rgba(212, 168, 83, 0.35)',
        'primary-glow': '0 0 20px rgba(30, 58, 95, 0.25)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4A853 0%, #E4C57D 50%, #DCB75F 100%)',
        'primary-gradient': 'linear-gradient(135deg, #1E3A5F 0%, #2E4A80 50%, #3D5D97 100%)',
        'hero-pattern': "radial-gradient(ellipse at top left, rgba(30, 58, 95, 0.08), transparent 50%), radial-gradient(ellipse at bottom right, rgba(212, 168, 83, 0.06), transparent 50%)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
