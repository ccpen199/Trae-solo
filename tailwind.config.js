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
        'deep-blue': {
          50: '#E6ECF8',
          100: '#C3D1EF',
          200: '#9AB2E3',
          300: '#7093D7',
          400: '#527BCF',
          500: '#3364C6',
          600: '#2E5CC2',
          700: '#2752BB',
          800: '#0B3D91',
          900: '#072A66',
          950: '#041A45',
        },
        'aqua': {
          50: '#E6FAFD',
          100: '#BFF2F9',
          200: '#80E5F4',
          300: '#40D8EE',
          400: '#1CCDE8',
          500: '#00B4D8',
          600: '#0096B5',
          700: '#00748C',
          800: '#005263',
          900: '#00303A',
        },
        'vibrant-orange': {
          50: '#FFF0EA',
          100: '#FFD8C7',
          200: '#FFBE9F',
          300: '#FFA477',
          400: '#FF8F58',
          500: '#FF6B35',
          600: '#F95A2A',
          700: '#E4441B',
          800: '#C93113',
          900: '#A31E0B',
        },
        'graphite': {
          50: '#F5F7FA',
          100: '#E4E7EC',
          200: '#CBD0D8',
          300: '#A0A6B3',
          400: '#667085',
          500: '#475467',
          600: '#344054',
          700: '#1D2939',
          800: '#1A1A2E',
          900: '#0F0F1A',
        },
      },
      fontFamily: {
        'display': ['"Noto Serif SC"', 'serif'],
        'body': ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'ripple': 'ripple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-aqua': '0 0 20px rgba(0, 180, 216, 0.4)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.4)',
        'glow-blue': '0 0 20px rgba(11, 61, 145, 0.4)',
      },
    },
  },
  plugins: [],
};
