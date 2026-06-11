/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
      }
    },
    extend: {
      colors: {
        brand: {
          50: '#E8F0FE',
          100: '#D1E1FD',
          200: '#A3C3FB',
          300: '#75A5F9',
          400: '#4787F7',
          500: '#0052D9',
          600: '#0041AE',
          700: '#003183',
          800: '#002057',
          900: '#00102C',
        },
        alert: {
          50: '#FFF2E6',
          100: '#FFE6CC',
          200: '#FFCD99',
          300: '#FFB366',
          400: '#FF9A33',
          500: '#FF6A00',
          600: '#CC5500',
          700: '#994000',
          800: '#662A00',
          900: '#331500',
        },
        bg: {
          50: '#FAFBFC',
          100: '#F0F4FA',
          200: '#E1E8F0',
        }
      },
      fontFamily: {
        sans: ['"Source Han Sans CN"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        din: ['DIN Alternate', 'DIN', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px 0 rgba(0, 82, 217, 0.06)',
        'card-hover': '0 8px 24px 0 rgba(0, 82, 217, 0.12)',
        'float': '0 4px 20px 0 rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-red': 'pulseRed 1.5s infinite',
        'grow-up': 'growUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 106, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 106, 0, 0)' },
        },
        growUp: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
      },
    },
  },
  plugins: [],
};
