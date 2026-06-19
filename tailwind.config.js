/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          50: "#f0f4fa",
          100: "#d9e2ef",
          200: "#b3c5de",
          300: "#809cc6",
          400: "#5578ac",
          500: "#3a5a92",
          600: "#2a4576",
          700: "#1e3a5f",
          800: "#1a2f4c",
          900: "#16273e",
          950: "#0d1726",
        },
        accent: {
          gold: "#c9a962",
          "gold-light": "#dbc48e",
          "gold-dark": "#b08f48",
          teal: "#2dd4bf",
          "teal-light": "#5eead4",
          "teal-dark": "#14b8a6",
        },
        neutral: {
          warm: "#fafaf7",
          "warm-100": "#f3f2ec",
          "warm-200": "#e6e4da",
        },
        status: {
          pending: "#f59e0b",
          approved: "#10b981",
          rejected: "#ef4444",
          frozen: "#6b7280",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['"Noto Sans SC"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: "0 1px 3px rgba(30, 58, 95, 0.08), 0 1px 2px rgba(30, 58, 95, 0.06)",
        "card-hover": "0 10px 25px -5px rgba(30, 58, 95, 0.1), 0 8px 10px -6px rgba(30, 58, 95, 0.08)",
        gold: "0 0 0 1px rgba(201, 169, 98, 0.3), 0 4px 12px rgba(201, 169, 98, 0.15)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #1e3a5f 0%, #16273e 50%, #0d1726 100%)",
        "gold-gradient": "linear-gradient(135deg, #c9a962 0%, #dbc48e 100%)",
        "card-gradient": "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(250,250,247,0.95) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "flame": "flame 0.5s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        flame: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.5)" },
        },
      },
    },
  },
  plugins: [],
};
