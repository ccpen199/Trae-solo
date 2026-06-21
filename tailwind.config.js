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
        brand: {
          DEFAULT: '#0A2540',
          50: '#E6EDF5',
          100: '#C2D3E8',
          200: '#8FAAD1',
          300: '#5C81BA',
          400: '#355FA4',
          500: '#0A2540',
          600: '#081F36',
          700: '#06192B',
          800: '#041320',
          900: '#020C15',
        },
        accent: {
          DEFAULT: '#FF6B35',
          50: '#FFF0EA',
          100: '#FFD8C7',
          200: '#FFB594',
          300: '#FF9261',
          400: '#FF7A3E',
          500: '#FF6B35',
          600: '#E8561F',
          700: '#BF4217',
          800: '#963211',
          900: '#6D240C',
        },
        mint: {
          DEFAULT: '#2DD4A8',
          50: '#E8FBF5',
          100: '#C3F3E3',
          200: '#8FE6CA',
          300: '#5BD9B1',
          400: '#38D1A2',
          500: '#2DD4A8',
          600: '#22B58E',
          700: '#1A8E6F',
          800: '#126751',
          900: '#0B4033',
        },
        warm: {
          bg: '#F8F7F4',
          card: '#F5F0E8',
          surface: '#FFFBF5',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '16px',
        '3xl2': '24px',
      },
      boxShadow: {
        'soft': '0 4px 24px -8px rgba(10, 37, 64, 0.12)',
        'card': '0 8px 40px -12px rgba(10, 37, 64, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
