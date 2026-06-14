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
        primary: "#165DFF",
        gold: "#FFB020",
        success: "#00B42A",
        danger: "#F53F3F",
        warning: "#FF7D00",
      },
    },
  },
  plugins: [],
};
