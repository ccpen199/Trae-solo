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
          50: '#e8f5ee',
          100: '#c6e6d4',
          200: '#9fd4b5',
          300: '#74c194',
          400: '#4fae76',
          500: '#0D7C3E',
          600: '#0a6332',
          700: '#084a26',
          800: '#05311a',
          900: '#03180e',
        },
        gold: {
          50: '#fdf8e8',
          100: '#f9edc4',
          200: '#f4df9b',
          300: '#efd172',
          400: '#e8c34d',
          500: '#D4A017',
          600: '#b8880f',
          700: '#9c7008',
          800: '#7f5804',
          900: '#5c3e01',
        },
        earth: {
          50: '#f5f0eb',
          100: '#e8ddd0',
          200: '#d4c0a3',
          300: '#bfa176',
          400: '#a9894f',
          500: '#3E2723',
          600: '#35201c',
          700: '#2b1a15',
          800: '#221310',
          900: '#180c0a',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
