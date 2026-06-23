/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./src/**/*.tsx", "./src/**/*.ts"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: '#006F3C',
        secondary: '#1E40AF',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
    },
  },
  plugins: [],
};
