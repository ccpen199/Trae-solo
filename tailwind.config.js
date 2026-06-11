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
          DEFAULT: '#1B2A4A',
          light: '#2D4A7A',
          50: '#E8ECF4',
          100: '#D1D9E9',
          200: '#A3B3D3',
          300: '#758DBD',
          400: '#4767A7',
          500: '#1B2A4A',
          600: '#15213A',
          700: '#0F1829',
          800: '#0A0F19',
          900: '#05070C',
        },
        accent: {
          DEFAULT: '#E8A838',
          light: '#F5C563',
          dark: '#C98A1F',
          50: '#FDF5E6',
          100: '#FAEBCC',
          200: '#F5D799',
          300: '#F0C366',
          400: '#E8A838',
          500: '#C98A1F',
          600: '#A96E0D',
          700: '#7A5009',
          800: '#4B3106',
          900: '#1C1202',
        },
        success: '#2ECC71',
        danger: '#E74C3C',
        warning: '#F39C12',
        bg: '#F4F6F9',
        card: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'count-up': 'countUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
