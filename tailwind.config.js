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
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3385FF',
          500: '#0066FF',
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
        },
        accent: {
          50: '#FFF0E8',
          100: '#FFE1D1',
          200: '#FFC4A3',
          300: '#FFA675',
          400: '#FF8947',
          500: '#FF6B35',
          600: '#CC552A',
          700: '#994020',
          800: '#662A15',
          900: '#33150B',
        },
        background: '#F8F9FA',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
};
