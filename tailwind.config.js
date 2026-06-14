/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        brand: {
          50: "#EAF2FF",
          100: "#D5E6FF",
          200: "#A9CDFF",
          300: "#7DB3FF",
          400: "#4E96FF",
          500: "#1E6FFF",
          600: "#1A5EE0",
          700: "#154EB8",
          800: "#0F3C8F",
          900: "#0A2B66",
        },
        accent: {
          50: "#FFF1EA",
          100: "#FFE3D5",
          200: "#FFC5AA",
          300: "#FFA880",
          400: "#FF8F5A",
          500: "#FF7A45",
          600: "#E06736",
          700: "#B85226",
          800: "#8F3E1B",
          900: "#662B11",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"PingFang SC"', '"Noto Sans SC"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(15, 60, 143, 0.08)",
        "card-hover": "0 8px 28px rgba(15, 60, 143, 0.14)",
        glow: "0 0 24px rgba(30, 111, 255, 0.25)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-down": "slideDown 0.35s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-468px 0" },
          "100%": { backgroundPosition: "468px 0" },
        },
      },
    },
  },
  plugins: [],
};
