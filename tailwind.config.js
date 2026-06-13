/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        ink: {
          50: "#F7F4EE",
          100: "#EFEADF",
          200: "#E5DCCB",
          300: "#CFC4AE",
          400: "#9D9078",
          500: "#7B6E57",
          600: "#4A4337",
          700: "#312C24",
          800: "#1E1A16",
          900: "#14110E",
          950: "#0B0907",
        },
        parchment: {
          50: "#FBF8F0",
          100: "#F5F0E6",
          200: "#E9DECA",
          300: "#D8C6A4",
          400: "#C2A672",
        },
        classic: {
          blue: "#3B5998",
          gold: "#B8860B",
          ochre: "#B8860B",
          cinnabar: "#C41E3A",
          turquoise: "#4A8B7A",
        },
      },
      fontFamily: {
        serif: [
          '"Noto Serif SC"',
          "Source Han Serif SC",
          "Songti SC",
          "SimSun",
          "serif",
        ],
        sans: [
          '"Noto Sans SC"',
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        book: "0 4px 16px rgba(26, 22, 32, 0.12), 0 1px 3px rgba(26, 22, 32, 0.06)",
        card: "0 2px 12px rgba(26, 22, 32, 0.08)",
        gold: "0 0 24px rgba(184, 134, 11, 0.2)",
        hover: "0 12px 32px rgba(0,0,0,.15)",
      },
      backgroundImage: {
        paper:
          "radial-gradient(circle at 1px 1px, rgba(184,134,11,.04) 1px, transparent 0)",
        "gold-gradient":
          "linear-gradient(135deg, #D4A843 0%, #B8860B 50%, #8B6508 100%)",
      },
      backgroundSize: {
        paper: "20px 20px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        breathe: {
          "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.01)" },
        },
      },
    },
  },
  plugins: [],
};
