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
        teal: {
          DEFAULT: "#0A2E3C",
          light: "#0D3D4F",
          dark: "#071E28",
        },
        orange: {
          DEFAULT: "#FF6B35",
          light: "#FF8A5C",
          dark: "#E55A25",
        },
      },
      fontFamily: {
        display: ['"Space Mono"', "monospace"],
        body: ['"DM Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
