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
          50: "#FFF5F0",
          100: "#FFE8D9",
          200: "#FFCEB0",
          300: "#FFAC7A",
          400: "#FF8B4D",
          500: "#FF6B35",
          600: "#F4511E",
          700: "#D84315",
          800: "#BF360C",
          900: "#8C2A0A",
        },
        secondary: {
          50: "#F0F7F8",
          100: "#D6EAEC",
          200: "#ACD4D9",
          300: "#6FB3BC",
          400: "#3E8C97",
          500: "#1A535C",
          600: "#15444C",
          700: "#11353B",
          800: "#0D272B",
          900: "#08181A",
        },
        cream: {
          50: "#FDFEFC",
          100: "#F7FFF7",
          200: "#EEFCEE",
          300: "#DFF5DF",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "system-ui",
          "sans-serif",
        ],
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"SimSun"',
          "Georgia",
          "serif",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "soft": "0 4px 20px -4px rgba(255, 107, 53, 0.15)",
        "card": "0 8px 30px -8px rgba(26, 83, 92, 0.12)",
        "glow": "0 0 30px rgba(255, 107, 53, 0.3)",
      },
    },
  },
  plugins: [],
};
