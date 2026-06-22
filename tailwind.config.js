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
          DEFAULT: '#1A3C34',
          light: '#2D5A4E',
          dark: '#0F2420',
          50: '#E8F0EC',
          100: '#D1E1D9',
          200: '#A3C3B3',
          300: '#75A58D',
          400: '#4D8B6D',
          500: '#1A3C34',
          600: '#162F29',
          700: '#11231E',
          800: '#0D1A16',
          900: '#08100D',
        },
        gold: {
          DEFAULT: '#C9A96E',
          light: '#D9C493',
          dark: '#B08D4F',
          50: '#FBF7EE',
          100: '#F5EDD8',
          200: '#EBDAB1',
          300: '#E1C78A',
          400: '#D5B474',
          500: '#C9A96E',
          600: '#B08D4F',
          700: '#8A6D3D',
          800: '#65502D',
          900: '#3F321C',
        },
        cream: '#F5F0E8',
        charcoal: '#2D2D2D',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
