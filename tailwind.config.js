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
        shujin: {
          50: '#fef2f4',
          100: '#fde6e9',
          200: '#fbd0d8',
          300: '#f7aabb',
          400: '#f07a94',
          500: '#e44d6d',
          600: '#C41230',
          700: '#a80e28',
          800: '#8d0f24',
          900: '#751224',
          950: '#42050f',
        },
        jinguan: {
          50: '#fdf9ed',
          100: '#faf0cc',
          200: '#f5e096',
          300: '#f0ca55',
          400: '#D4A843',
          500: '#c4922d',
          600: '#a87322',
          700: '#8a571f',
          800: '#724620',
          900: '#5f3a1f',
          950: '#361c0d',
        },
        wudu: {
          50: '#f6f6f8',
          100: '#ededf1',
          200: '#d8d8e1',
          300: '#b8b8c9',
          400: '#9494ad',
          500: '#75758e',
          600: '#5e5e74',
          700: '#4d4d5f',
          800: '#2D2D3A',
          900: '#1e1e28',
          950: '#111116',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'ripple': 'ripple 0.6s ease-out',
        'scan': 'scan 2s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 168, 67, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(212, 168, 67, 0.1)' },
        },
      },
    },
  },
  plugins: [],
};
