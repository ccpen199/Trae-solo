/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0faf4",
          100: "#daf3e4",
          200: "#b8e6cc",
          300: "#86d2aa",
          400: "#53b884",
          500: "#2D8653",
          600: "#256b43",
          700: "#1f5537",
          800: "#1a442d",
          900: "#163825",
        },
        cream: {
          50: "#FFFBF5",
          100: "#FFF5E6",
          200: "#FFEAC7",
        },
        warm: {
          50: "#fff5ee",
          100: "#ffe7d5",
          200: "#ffcaa9",
          300: "#ffa872",
          400: "#FF8C42",
          500: "#e8742a",
          600: "#c85b20",
        },
      },
      fontFamily: {
        display: ['"Quicksand"', "system-ui", "sans-serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0, 0, 0, 0.08)",
        card: "0 2px 12px rgba(45, 134, 83, 0.08)",
        hover: "0 8px 30px rgba(45, 134, 83, 0.12)",
      },
      animation: {
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
  },
  plugins: [],
};
