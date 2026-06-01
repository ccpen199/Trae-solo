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
        primary: '#1e3a5f',
        accent: '#e8723a',
        bg: '#f5f6fa',
        card: '#ffffff',
        label: '#dbeafe',
      },
    },
  },
  plugins: [],
};
