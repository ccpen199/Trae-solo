/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        seal: '#c1121f',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['"HarmonyOS Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif CN"', 'SimSun', 'serif'],
      },
      backgroundImage: {
        'gov-texture':
          "radial-gradient(circle at 1px 1px, rgba(30, 64, 175, 0.06) 1px, transparent 0)",
        'hero-gradient':
          'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
      },
      backgroundSize: {
        'texture': '24px 24px',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(30, 64, 175, 0.08)',
        'card-hover': '0 12px 40px -4px rgba(30, 64, 175, 0.18)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
