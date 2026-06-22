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
        esports: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A855F7",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6B21A8",
          800: "#581C87",
          900: "#4C1D95",
          950: "#2E1065",
        },
        night: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#94A3B8",
          400: "#64748B",
          500: "#475569",
          600: "#334155",
          700: "#1F2937",
          800: "#1F1F2E",
          900: "#0F0F1A",
          950: "#08080F",
        },
        diamond: {
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },
        gold: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        victory: {
          red: "#EF4444",
          green: "#10B981",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Noto Sans SC", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gradient-esports": "linear-gradient(135deg, #6B21A8 0%, #A855F7 50%, #C4B5FD 100%)",
        "gradient-gold": "linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)",
        "gradient-diamond": "linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #22D3EE 100%)",
        "gradient-victory": "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        "gradient-night": "linear-gradient(180deg, #0F0F1A 0%, #1F1F2E 100%)",
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)",
      },
      boxShadow: {
        "esports-glow": "0 0 20px rgba(168, 85, 247, 0.35), 0 4px 12px rgba(0, 0, 0, 0.4)",
        "esports-glow-lg": "0 0 40px rgba(168, 85, 247, 0.5), 0 8px 32px rgba(0, 0, 0, 0.5)",
        "gold-glow": "0 0 20px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)",
        "diamond-glow": "0 0 20px rgba(6, 182, 212, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card-hover": "0 12px 40px rgba(168, 85, 247, 0.25), 0 6px 20px rgba(0,0,0,0.5)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "marquee": "marquee 40s linear infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.35)" },
          "50%": { boxShadow: "0 0 40px rgba(168, 85, 247, 0.6)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
