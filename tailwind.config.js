/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        honghe: {
          red: "#C4533A",
          "red-light": "#D4725E",
          "red-dark": "#A3402C",
          blue: "#2D5A7B",
          "blue-light": "#3D7AA8",
          "blue-dark": "#1E3D55",
          gold: "#E8B44D",
          "gold-light": "#F0C876",
          green: "#5A8F5A",
          "green-light": "#7AB87A",
        },
        warm: {
          50: "#F5F0EB",
          100: "#EDE5DB",
          200: "#DDD0C0",
          300: "#C9B49E",
          400: "#B09478",
          500: "#9A7B5E",
          600: "#7D6149",
          700: "#5C4737",
          800: "#3D3532",
          900: "#2A2420",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
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
      },
    },
  },
  plugins: [],
};
