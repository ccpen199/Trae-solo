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
          50: "#F0F5FF",
          100: "#E0EBFF",
          200: "#B9D1FF",
          300: "#7DA8FF",
          400: "#4D7FFF",
          500: "#1E4D8C",
          600: "#183E70",
          700: "#153A6B",
          800: "#0F2A4E",
          900: "#0A1C33",
        },
        secondary: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#2D9D72",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        accent: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#E8A838",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 20px rgba(0, 0, 0, 0.12)",
        float: "0 4px 16px rgba(0, 0, 0, 0.1)",
        popup: "0 8px 32px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        card: "12px",
      },
      fontFamily: {
        sans: ["PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"],
      },
    },
  },
  plugins: [],
};
