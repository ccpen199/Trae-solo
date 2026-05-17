/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF8C42',
        secondary: '#FFB5C5',
        sky: '#87CEEB',
        green: '#90EE90',
        cream: '#FFF8F0',
      },
    },
  },
  plugins: [],
}
