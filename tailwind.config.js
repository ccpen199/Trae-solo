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
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        night: {
          900: "#0F0F1A",
          800: "#1A1A2E",
          700: "#22223B",
          600: "#2A2A45",
          500: "#333355",
        },
        emerald: {
          DEFAULT: "#00C853",
        },
        coral: {
          DEFAULT: "#FF5252",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "'DIN Alternate'", "sans-serif"],
        sans: ["'PingFang SC'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        "gold-gradient-radial":
          "radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.25) 0%, transparent 60%)",
        "night-glow":
          "linear-gradient(135deg, #1A1A2E 0%, #0F0F1A 100%)",
      },
      boxShadow: {
        gold: "0 0 32px rgba(255, 215, 0, 0.35)",
        "gold-sm": "0 0 16px rgba(255, 215, 0, 0.25)",
        card: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 8px rgba(255, 215, 0, 0.3)" },
          "100%": { boxShadow: "0 0 28px rgba(255, 215, 0, 0.65)" },
        },
      },
    },
  },
  plugins: [],
};
