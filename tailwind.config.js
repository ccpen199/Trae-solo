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
        'gov-blue': {
          50: '#E8F0FB',
          100: '#D1E1F7',
          200: '#A3C3EF',
          300: '#75A5E7',
          400: '#4787DF',
          500: '#1A5FB4',
          600: '#155A9E',
          700: '#104577',
          800: '#0B3051',
          900: '#061A2B',
          950: '#030D16',
        },
        convenience: '#2EC4B6',
        alert: '#E76F51',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
