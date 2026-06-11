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
          50: "#FFF5EE",
          100: "#FFE8D6",
          200: "#FFCFAD",
          300: "#FFB07A",
          400: "#FF8A47",
          500: "#FF6B1A",
          600: "#F05505",
          700: "#C74300",
          800: "#9E3600",
          900: "#7A2B00",
        },
        secondary: {
          50: "#EAF0F9",
          100: "#CFDCEF",
          200: "#A5BCD9",
          300: "#7899BE",
          400: "#4F74A3",
          500: "#0F2847",
          600: "#0B1F38",
          700: "#08172A",
          800: "#050F1C",
          900: "#030910",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ['"PingFang SC"', '"Helvetica Neue"', "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(15, 40, 71, 0.08)",
        "card-hover": "0 8px 30px rgba(255, 107, 26, 0.15)",
        glow: "0 0 20px rgba(255, 107, 26, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
