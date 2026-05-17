/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdecd8',
          200: '#f9d5b0',
          300: '#f4b87d',
          400: '#ee924a',
          500: '#e97125',
          600: '#da571b',
          700: '#b54119',
          800: '#90351d',
          900: '#742d1b',
        }
      }
    },
  },
  plugins: [],
}
