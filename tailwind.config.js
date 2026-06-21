/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F0F4FA",
          100: "#D1DBEC",
          200: "#A3B7D9",
          300: "#7593C6",
          400: "#476FB3",
          500: "#194BA0",
          600: "#143C80",
          700: "#0F2D60",
          800: "#0A1E40",
          900: "#0A1628",
          950: "#050B14",
        },
        accent: {
          gold: "#C9A962",
          "gold-light": "#E8D5A3",
          "gold-dark": "#A88942",
          red: "#B23A48",
          "red-light": "#D46B78",
          "red-dark": "#8E2A36",
        },
        neutral: {
          ivory: "#F5F1E8",
          "ivory-dark": "#E8E0D0",
          ink: {
            50: "#F8F9FA",
            100: "#E9ECEF",
            200: "#DEE2E6",
            300: "#CED4DA",
            400: "#ADB5BD",
            500: "#6B7280",
            600: "#495057",
            700: "#343A40",
            800: "#212529",
            900: "#111827",
          },
        },
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'SimSun', 'serif'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: "0 2px 8px rgba(10, 22, 40, 0.08)",
        "card-hover": "0 8px 24px rgba(10, 22, 40, 0.12)",
        "gold-glow": "0 0 20px rgba(201, 169, 98, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "number-roll": "numberRoll 1.5s ease-out",
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
        numberRoll: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
