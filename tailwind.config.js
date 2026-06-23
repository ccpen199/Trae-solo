/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
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
    extend: {
      colors: {
        primary: {
          50: "#FFF3ED",
          100: "#FFE4D6",
          200: "#FFC8AD",
          300: "#FFA87A",
          400: "#FF8C54",
          500: "#FF7A45",
          600: "#E86230",
          700: "#C24D20",
          800: "#9A3C17",
          900: "#7A2F10",
        },
        secondary: {
          50: "#E6F4F4",
          100: "#C2E4E4",
          200: "#8FCFCF",
          300: "#5CB8B8",
          400: "#3A9A9A",
          500: "#2C7A7B",
          600: "#236162",
          700: "#1B4A4B",
          800: "#143637",
          900: "#0E2526",
        },
        warm: {
          bg: "#FFF8F4",
          card: "#FFFFFF",
          border: "#E5E5E5",
          text: "#1A1A1A",
          "text-secondary": "#555555",
        },
        hc: {
          bg: "#000000",
          text: "#FFD700",
          primary: "#00FFFF",
          card: "#1A1A1A",
          border: "#FFD700",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans SC"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      fontSize: {
        a11y: "var(--font-size-current)",
        "a11y-sm": "calc(var(--font-size-current) - 2px)",
        "a11y-lg": "calc(var(--font-size-current) + 4px)",
        "a11y-xl": "calc(var(--font-size-current) + 10px)",
        "a11y-2xl": "calc(var(--font-size-current) + 18px)",
        "a11y-3xl": "calc(var(--font-size-current) + 30px)",
      },
      borderRadius: {
        a11y: "16px",
      },
      minHeight: {
        a11y: "48px",
      },
      minWidth: {
        a11y: "48px",
      },
      boxShadow: {
        a11y: "0 4px 20px rgba(0, 0, 0, 0.08)",
        "a11y-hover": "0 6px 28px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
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
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
