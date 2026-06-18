/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        gov: {
          DEFAULT: "#1E5AA8",
          50: "#EAF2FB",
          100: "#D5E4F7",
          200: "#ABC9EF",
          300: "#81ADE7",
          400: "#5792DF",
          500: "#2D77D7",
          600: "#1E5AA8",
          700: "#17447F",
          800: "#112E57",
          900: "#0A182F",
        },
        success: {
          DEFAULT: "#2E7D32",
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#4CAF50",
          600: "#2E7D32",
          700: "#1B5E20",
        },
        warning: {
          DEFAULT: "#F9A825",
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F",
          400: "#FFCA28",
          500: "#FFC107",
          600: "#F9A825",
          700: "#F57F17",
        },
        danger: {
          DEFAULT: "#C62828",
          50: "#FFEBEE",
          100: "#FFCDD2",
          200: "#EF9A9A",
          300: "#E57373",
          400: "#EF5350",
          500: "#F44336",
          600: "#C62828",
          700: "#B71C1C",
        },
        ink: {
          DEFAULT: "#2C3E50",
          light: "#7F8C8D",
          lighter: "#BDC3C7",
          bg: "#F5F7FA",
          card: "#FFFFFF",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans SC"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif CN"',
          '"SimSun"',
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
        "card-hover": "0 4px 12px rgba(30,90,168,0.12), 0 2px 4px rgba(0,0,0,0.08)",
        glow: "0 0 0 4px rgba(30,90,168,0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
