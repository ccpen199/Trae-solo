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
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#627D98',
          500: '#1E3A5F',
          600: '#1A3150',
          700: '#152840',
          800: '#101F30',
          900: '#0B1620',
        },
        accent: {
          50: '#FFF5F5',
          100: '#FFE0E0',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#FF6B6B',
          500: '#FF5252',
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
        },
        mint: {
          50: '#E8F8F5',
          100: '#C8F0E8',
          200: '#A5E7DB',
          300: '#7EDDCC',
          400: '#4ECDC4',
          500: '#26C6DA',
          600: '#00ACC1',
          700: '#0097A7',
          800: '#00838F',
          900: '#006064',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F6FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#2D3436',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(30, 58, 95, 0.08)',
        'card-hover': '0 8px 30px rgba(30, 58, 95, 0.12)',
        'glow': '0 0 20px rgba(78, 205, 196, 0.3)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
