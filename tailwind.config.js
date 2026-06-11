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
          DEFAULT: "#0F2B46",
          50: "#E8EEF4",
          100: "#D1DEE9",
          200: "#A3BDD3",
          300: "#759CBD",
          400: "#477BA7",
          500: "#1A5FB4",
          600: "#154D8F",
          700: "#0F3A6A",
          800: "#0F2B46",
          900: "#0A1D30",
        },
        gov: {
          red: "#C41E3A",
          gold: "#D4A843",
          blue: "#1A5FB4",
        },
        neutral: {
          slate: "#475569",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          divider: "#F1F5F9",
        },
        status: {
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
          info: "#2563EB",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
