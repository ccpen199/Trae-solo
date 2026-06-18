/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
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
          500: '#165DFF',
          600: '#0E47CC',
          700: '#0A3599',
          800: '#062466',
          900: '#021233',
        },
        accent: {
          50: '#FFF3E6',
          100: '#FFE7CC',
          200: '#FFD099',
          300: '#FFB866',
          400: '#FFA133',
          500: '#FF7D00',
          600: '#CC6400',
          700: '#994B00',
          800: '#663200',
          900: '#331900',
        },
        success: '#00B42A',
        warning: '#FF7D00',
        danger: '#F53F3F',
        info: '#86909C',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'card-lg': '0 6px 20px rgba(22, 93, 255, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #165DFF 0%, #0A3599 100%)',
        'gradient-hero': 'linear-gradient(180deg, #E6F0FF 0%, #FFFFFF 100%)',
        'gradient-card': 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FA 100%)',
      },
    },
  },
  plugins: [],
};
