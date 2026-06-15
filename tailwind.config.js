/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3385FF',
          500: '#0066CC',
          600: '#0052A3',
          700: '#003D7A',
          800: '#002952',
          900: '#001429',
        },
        eco: {
          50: '#E8F8F0',
          100: '#D1F1E1',
          200: '#A3E3C3',
          300: '#75D5A5',
          400: '#47C787',
          500: '#22AA66',
          600: '#1B8852',
          700: '#14663D',
          800: '#0E4429',
          900: '#072214',
        },
        warm: {
          50: '#FFF2E6',
          100: '#FFE6CC',
          200: '#FFCD99',
          300: '#FFB466',
          400: '#FF9B33',
          500: '#FF8833',
          600: '#CC6D29',
          700: '#99521F',
          800: '#663614',
          900: '#331B0A',
        },
        danger: {
          500: '#E53935',
          600: '#D32F2F',
        },
        success: {
          500: '#4CAF50',
          600: '#388E3C',
        },
        info: {
          500: '#2196F3',
          600: '#1976D2',
        },
        dark: {
          bg: '#0A1929',
          card: '#132F4C',
          border: '#1E3A5F',
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        glow: '0 0 20px rgba(0, 102, 204, 0.3)',
        'glow-green': '0 0 20px rgba(34, 170, 102, 0.3)',
        'glow-orange': '0 0 20px rgba(255, 136, 51, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0066CC 0%, #0099FF 100%)',
        'gradient-eco': 'linear-gradient(135deg, #22AA66 0%, #44CC88 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF8833 0%, #FFAA66 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0A1929 0%, #132F4C 100%)',
      },
    },
  },
  plugins: [],
};
