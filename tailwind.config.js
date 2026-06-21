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
          50: "#E6ECF5",
          100: "#C4D1E6",
          200: "#8EA6CC",
          300: "#597BB3",
          400: "#355A94",
          500: "#0F3460",
          600: "#0D2D54",
          700: "#0B2648",
          800: "#09203C",
          900: "#071A30",
          950: "#051220",
        },
        accent: {
          50: "#FDECEE",
          100: "#FBD0D6",
          200: "#F7A1AD",
          300: "#F37383",
          400: "#EE5669",
          500: "#E94560",
          600: "#D03E56",
          700: "#B5374C",
          800: "#9A3042",
          900: "#802938",
        },
        success: {
          50: "#E6F9F3",
          100: "#BFF0DE",
          200: "#6ADFBB",
          300: "#3BD4A6",
          400: "#28CD99",
          500: "#16C79A",
          600: "#14B38B",
          700: "#119F7B",
          800: "#0F8B6C",
          900: "#0D775C",
        },
        slate2: {
          50: "#F8F9FA",
          100: "#ECEEF1",
          200: "#D5DAE0",
          300: "#AEB7C2",
          400: "#808C9C",
          500: "#5D6A7C",
          600: "#4A5566",
          700: "#3E4653",
          800: "#1A1A2E",
          900: "#16213E",
          950: "#0F0F1A",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 52, 96, 0.08), 0 1px 2px rgba(15, 52, 96, 0.04)",
        cardHover:
          "0 10px 25px rgba(15, 52, 96, 0.12), 0 4px 10px rgba(15, 52, 96, 0.08)",
        glow: "0 0 20px rgba(22, 199, 154, 0.3)",
        alert: "0 0 20px rgba(233, 69, 96, 0.3)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(15px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease-out forwards",
        slideInRight: "slideInRight 0.3s ease-out forwards",
        pulseRing: "pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        blink: "blink 1.5s ease-in-out infinite",
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
