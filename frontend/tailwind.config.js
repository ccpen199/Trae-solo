/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pdd-red': '#e4393c',
        'pdd-orange': '#ff6a00',
        'pdd-bg': '#f5f5f5'
      }
    },
  },
  plugins: [],
}
