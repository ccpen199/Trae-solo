/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        brand: {
          50: "#E8F4FD",
          100: "#C8DCEF",
          200: "#97BADF",
          300: "#6597CE",
          400: "#3C7CC1",
          500: "#1B3A5C",
          600: "#173250",
          700: "#122840",
          800: "#0D1E30",
          900: "#081420",
        },
        gold: {
          50: "#FBF6E9",
          100: "#F4E7C2",
          200: "#E9D28A",
          300: "#DEBD52",
          400: "#D4A843",
          500: "#B88B2F",
          600: "#946E25",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans SC",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 12px rgba(27, 58, 92, 0.08)",
        "card-hover": "0 6px 24px rgba(27, 58, 92, 0.14)",
      },
      borderRadius: {
        xl2: "12px",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #1B3A5C 0%, #2A5588 60%, #3C7CC1 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #D4A843 0%, #E9D28A 100%)",
        "hero-gradient":
          "linear-gradient(120deg, #1B3A5C 0%, #2A5588 45%, #3C7CC1 100%)",
      },
    },
  },
  plugins: [],
};
