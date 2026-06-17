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
          50: "#e8edf5",
          100: "#c5d0e6",
          200: "#9fb1d5",
          300: "#7891c4",
          400: "#5b79b8",
          500: "#3e61ab",
          600: "#3859a4",
          700: "#304f9a",
          800: "#284591",
          900: "#1a365d",
        },
        emerald: {
          50: "#e6f5ec",
          100: "#c0e5cf",
          200: "#96d3b0",
          300: "#6cc190",
          400: "#4db478",
          500: "#2d8a56",
          600: "#277a4c",
          700: "#216841",
          800: "#1b5637",
          900: "#103623",
        },
        gold: {
          50: "#faf5e6",
          100: "#f2e4be",
          200: "#e9d192",
          300: "#e0be66",
          400: "#dab143",
          500: "#d4a843",
          600: "#c09538",
          700: "#a67f2e",
          800: "#8d6a25",
          900: "#6a4e18",
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Source Han Serif SC"', "Georgia", "serif"],
        body: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "slide-right": "slideRight 0.3s ease-out forwards",
        "count-up": "countUp 1s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
