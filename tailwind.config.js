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
          50: '#FDF2F3',
          100: '#FBE4E6',
          200: '#F5C2C7',
          300: '#E8919A',
          400: '#DC5C6A',
          500: '#C8102E',
          600: '#A80D26',
          700: '#8A0B20',
          800: '#6D091A',
          900: '#520714',
        },
        landscape: {
          50: '#F0F6F5',
          100: '#DCE8E6',
          200: '#B9D1CD',
          300: '#8FB5AE',
          400: '#5E8780',
          500: '#2D5A52',
          600: '#244943',
          700: '#1D3A36',
          800: '#162C29',
          900: '#0F1E1C',
        },
        amber: {
          50: '#FFF9E6',
          100: '#FFF1C2',
          200: '#FFE485',
          300: '#FFD647',
          400: '#F5C400',
          500: '#F0A500',
          600: '#C98A00',
          700: '#A36F00',
          800: '#7E5500',
          900: '#5A3D00',
        },
        porcelain: {
          50: '#EAF1F9',
          100: '#D5E3F3',
          200: '#ABC7E7',
          300: '#7AAADB',
          400: '#4A8ECF',
          500: '#1A4B8C',
          600: '#153D73',
          700: '#102F59',
          800: '#0A2040',
          900: '#051226',
        },
        ink: {
          50: '#F5F5F0',
          100: '#E5E5DC',
          200: '#CCCCBB',
          300: '#B2B299',
          400: '#999977',
          500: '#4A4A4A',
          600: '#333333',
          700: '#1A1A1A',
          800: '#0D0D0D',
          900: '#000000',
        },
      },
      fontFamily: {
        serif: ['"Source Han Serif CN"', '"Noto Serif SC"', 'serif'],
        sans: ['"Source Han Sans CN"', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'ink': '0 2px 8px rgba(26, 26, 26, 0.15)',
      },
      animation: {
        'scroll-reveal': 'scrollReveal 0.8s ease-out forwards',
        'ink-spread': 'inkSpread 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        scrollReveal: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
