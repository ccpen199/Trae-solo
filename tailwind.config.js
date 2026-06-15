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
        navy: {
          50: "#f1f5f9",
          100: "#e2e8f0",
          200: "#94a3b8",
          300: "#64748b",
          400: "#475569",
          500: "#334155",
          600: "#1e3a5f",
          700: "#162d4a",
          800: "#0f1f33",
          900: "#0a1624",
        },
        gold: {
          50: "#fdf8ec",
          100: "#f9ecc4",
          200: "#f3d988",
          300: "#ecc451",
          400: "#d9a93a",
          500: "#c9a24a",
          600: "#a8853a",
          700: "#856730",
          800: "#634d26",
          900: "#42341c",
        },
        mint: {
          400: "#4ade80",
          500: "#22c55e",
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"LXGW WenKai"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: "0 4px 24px rgba(30, 58, 95, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)",
        "paper-hover": "0 8px 40px rgba(30, 58, 95, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1)",
        card: "0 2px 12px rgba(30, 58, 95, 0.08)",
        "card-hover": "0 6px 24px rgba(201, 162, 74, 0.15)",
        glow: "0 0 20px rgba(201, 162, 74, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
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
