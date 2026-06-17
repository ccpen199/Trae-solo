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
        "deep-space": {
          950: "#050B18",
          900: "#0A1628",
          800: "#0F1E38",
          700: "#172947",
          600: "#1F3456",
          500: "#2A4065",
          400: "#3B4D75",
          300: "#53678D",
        },
        "cyber-cyan": {
          100: "#CCFCFF",
          200: "#99F9FF",
          300: "#66F6FF",
          400: "#33F5FF",
          500: "#00F0FF",
          600: "#00C8D6",
          700: "#0099A3",
          800: "#006B73",
        },
        "amber-gold": {
          100: "#FFF1CC",
          200: "#FFE499",
          300: "#FFD666",
          400: "#FFC933",
          500: "#FFB800",
          600: "#D49A00",
          700: "#A87A00",
          800: "#7A5A00",
        },
        success: {
          100: "#CCFFE5",
          200: "#99FFCB",
          300: "#66FFB2",
          400: "#4DFF9B",
          500: "#00E676",
          600: "#00C468",
          700: "#009E54",
        },
        warning: {
          100: "#FFF0CC",
          200: "#FFE199",
          300: "#FFD166",
          400: "#FFAD33",
          500: "#FF9100",
          600: "#E67E00",
          700: "#CC6F00",
        },
        danger: {
          100: "#FFD7E4",
          200: "#FFB0CC",
          300: "#FF89B3",
          400: "#FF6B8F",
          500: "#FF3D71",
          600: "#E62E61",
          700: "#CC2856",
        },
      },
      fontFamily: {
        display: ["DM Sans", "system-ui", "sans-serif"],
        sans: ["Noto Sans SC", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "marquee": "marquee 20s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 240, 255, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 240, 255, 0.3)",
        "glow-gold": "0 0 20px rgba(255, 184, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
