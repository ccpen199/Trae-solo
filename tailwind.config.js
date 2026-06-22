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
        jade: {
          50: "#EDFBF5",
          100: "#D4F5E5",
          200: "#ACEBD0",
          300: "#76D9B3",
          400: "#3EC093",
          500: "#0D9B6A",
          600: "#097D55",
          700: "#0A6346",
          800: "#0C4F3A",
          900: "#0B4131",
          950: "#04251C",
        },
        ember: {
          50: "#FFF6ED",
          100: "#FFE8D1",
          200: "#FFCFA3",
          300: "#FFAF6E",
          400: "#F28C38",
          500: "#E67020",
          600: "#CC5518",
          700: "#A84018",
          800: "#88341C",
          900: "#6F2C1A",
          950: "#3C130A",
        },
        rock: {
          50: "#F5F7FA",
          100: "#E8ECF2",
          200: "#D1D9E6",
          300: "#B3C0D4",
          400: "#8A9BB8",
          500: "#6B7F9E",
          600: "#556682",
          700: "#46536B",
          800: "#3D4759",
          900: "#1A2332",
          950: "#0F1520",
        },
      },
      fontFamily: {
        serif: ["Noto Serif SC", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        body: ['"LXGW WenKai"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
