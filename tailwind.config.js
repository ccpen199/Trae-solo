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
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        "cn-red": {
          50: "#FEF1EF",
          100: "#FDE0DC",
          200: "#FAC3BC",
          300: "#F59D92",
          400: "#ED6E60",
          500: "#DE2910",
          600: "#B91F0A",
          700: "#8E1707",
          800: "#631005",
          900: "#3A0A03",
        },
        "it-green": {
          50: "#E7F7EC",
          100: "#CFEFDA",
          200: "#A0DFB5",
          300: "#71CF91",
          400: "#3EB86A",
          500: "#009246",
          600: "#007A3B",
          700: "#005C2D",
          800: "#003E1F",
          900: "#002010",
        },
        "warm-gold": {
          50: "#FDF8ED",
          100: "#FBF0D6",
          200: "#F7DFA8",
          300: "#F2CD7A",
          400: "#E6BA4D",
          500: "#D4AF37",
          600: "#B89425",
          700: "#8F711B",
          800: "#634E12",
          900: "#362A08",
        },
        ivory: {
          50: "#FFFBF0",
          100: "#FFF8E7",
          200: "#FFF0CC",
          300: "#FFE6AB",
        },
        charcoal: {
          50: "#F5F5F5",
          100: "#E6E6E6",
          200: "#B8B8B8",
          300: "#8A8A8A",
          400: "#5C5C5C",
          500: "#2C2C2C",
          600: "#232323",
          700: "#1A1A1A",
          800: "#121212",
          900: "#090909",
        },
      },
      fontFamily: {
        "display-zh": ['"Noto Serif SC"', "serif"],
        "display-it": ['"Cormorant Garamond"', "serif"],
        "sans-zh": ['"Noto Sans SC"', "sans-serif"],
        "sans-it": ['"Inter"', "sans-serif"],
      },
      boxShadow: {
        elegant: "0 4px 24px -8px rgba(222, 41, 16, 0.12), 0 2px 8px -2px rgba(0, 146, 70, 0.08)",
        gold: "0 4px 20px -4px rgba(212, 175, 55, 0.25)",
        hover: "0 12px 40px -12px rgba(222, 41, 16, 0.2), 0 6px 16px -4px rgba(0, 146, 70, 0.15)",
      },
      backgroundImage: {
        "gradient-cnit": "linear-gradient(135deg, #DE2910 0%, #D4AF37 50%, #009246 100%)",
        "gradient-cn": "linear-gradient(135deg, #DE2910 0%, #ED6E60 100%)",
        "gradient-it": "linear-gradient(135deg, #009246 0%, #3EB86A 100%)",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #E6BA4D 100%)",
        "text-gradient-cnit": "linear-gradient(135deg, #DE2910, #D4AF37, #009246)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave": "wave 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
