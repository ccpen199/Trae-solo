/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FB7299',
        'primary-dark': '#F05A7E',
        secondary: '#23ADE5',
        neutral: {
          100: '#F6F6F6',
          200: '#E5E5E5',
          300: '#D1D1D1',
          400: '#999999',
          500: '#757575',
          600: '#505050',
          700: '#333333',
          800: '#181818',
          900: '#0F0F0F',
        }
      }
    },
  },
  plugins: [],
}
