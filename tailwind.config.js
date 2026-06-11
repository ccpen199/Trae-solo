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
          orange: "#FF6B35",
          indigo: "#1B3A5C",
        },
        secondary: {
          warmYellow: "#FFC857",
          mintGreen: "#2EC4B6",
          coralRed: "#E63946",
        },
      },
      fontFamily: {
        sans: ["Noto Sans SC", "sans-serif"],
        display: ["ZCOOL XiaoWei", "serif"],
      },
      borderRadius: {
        "4xl": "2.5rem",
      },
      boxShadow: {
        brand: "0 4px 14px 0 rgba(255, 107, 53, 0.25)",
        "brand-lg": "0 8px 24px 0 rgba(255, 107, 53, 0.30)",
        soft: "0 2px 12px 0 rgba(27, 58, 92, 0.08)",
        "soft-lg": "0 8px 24px 0 rgba(27, 58, 92, 0.10)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-brand": "pulseBrand 2s infinite",
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
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseBrand: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },
    },
  },
  plugins: [],
};
