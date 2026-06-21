/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1E5AA8',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        accent: {
          orange: '#FF8A3D',
          green: '#2ECC71',
          red: '#E74C3C',
          yellow: '#F39C12',
          purple: '#9B59B6',
          cyan: '#00BCD4',
        },
        gov: {
          blue: '#1E5AA8',
          'blue-light': '#2B7CD3',
          'blue-dark': '#143D72',
          'blue-50': '#F0F6FD',
          'blue-100': '#E1EEFB',
          'gold': '#C9A86C',
        },
        neutral: {
          50: '#FAFBFC',
          100: '#F5F7FA',
          200: '#EEF1F5',
          300: '#E1E5EB',
          400: '#C4CBD6',
          500: '#8F99A8',
          600: '#606A78',
          700: '#3E4452',
          800: '#2C3E50',
          900: '#1A1F29',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', '"SF Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 12px 0 rgba(30, 90, 168, 0.08)',
        'card-hover': '0 6px 24px 0 rgba(30, 90, 168, 0.15)',
        'popup': '0 4px 20px 0 rgba(0, 0, 0, 0.12)',
        'inset-blue': 'inset 0 2px 4px 0 rgba(30, 90, 168, 0.08)',
      },
      backgroundImage: {
        'gov-gradient': 'linear-gradient(135deg, #1E5AA8 0%, #2B7CD3 100%)',
        'gov-gradient-light': 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        'hero-pattern': 'linear-gradient(135deg, #1E5AA8 0%, #143D72 50%, #0F2C54 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'number-roll': 'numberRoll 1s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        numberRoll: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'lg': '10px',
        'xl': '14px',
        '2xl': '18px',
      },
    },
  },
  plugins: [],
};
