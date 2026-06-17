/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      colors: {
        cream: {
          50: "#FFFAF5",
          100: "#FFF3E8",
          200: "#FFE4CC",
        },
        brand: {
          orange: "#FF8A5B",
          "orange-light": "#FFB08A",
          "orange-dark": "#E56A3A",
          mint: "#4ECDC4",
          "mint-light": "#7EDDD6",
          "mint-dark": "#3AA89F",
        },
        accent: {
          pink: "#FFB6C1",
          sky: "#87CEEB",
          sunny: "#FFE066",
        },
        warm: {
          gray: "#8A8178",
          brown: "#3D3530",
        },
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', '"PingFang SC"', "sans-serif"],
        body: ['"PingFang SC"', '"Helvetica Neue"', "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(255, 138, 91, 0.15)",
        hover: "0 12px 32px -8px rgba(255, 138, 91, 0.25)",
        "mint-soft": "0 4px 24px -8px rgba(78, 205, 196, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-ring": "pulseRing 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "stagger-1": "staggerFade 0.5s ease-out 0.1s both",
        "stagger-2": "staggerFade 0.5s ease-out 0.2s both",
        "stagger-3": "staggerFade 0.5s ease-out 0.3s both",
        "stagger-4": "staggerFade 0.5s ease-out 0.4s both",
        "wave": "wave 1s ease-in-out infinite",
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
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.7" },
          "100%": { transform: "scale(0.95)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        staggerFade: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
};
