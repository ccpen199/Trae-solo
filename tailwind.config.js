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
          DEFAULT: '#1E3A5F',
          light: '#2A4F7F',
          dark: '#152C49',
        },
        accent: {
          DEFAULT: '#FF6B35',
          light: '#FF8B5E',
          dark: '#E85A25',
        },
        sidebar: '#0F172A',
      },
    },
  },
  plugins: [],
};
