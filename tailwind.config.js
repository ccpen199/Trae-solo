/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
        },
        trust: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
        },
      },
      fontFamily: {
        display: [
          '"Source Han Serif SC"',
          '"Noto Serif SC"',
          '"SimSun"',
          "serif",
        ],
        body: [
          '"Source Han Sans SC"',
          '"Noto Sans SC"',
          '"PingFang SC"',
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover":
          "0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)",
        modal: "0 25px 50px rgba(0,0,0,0.15)",
        glow: "0 0 20px rgba(30, 64, 175, 0.3)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.5s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "count-up": "countUp 1.5s ease-out",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(30, 64, 175, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 64, 175, 0.05) 1px, transparent 1px)",
        "gradient-radial":
          "radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1), transparent 60%)",
      },
    },
  },
  plugins: [],
};
