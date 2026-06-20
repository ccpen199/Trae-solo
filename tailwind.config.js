/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        background: "#1a1a2e",
        primary: "#e94560",
        secondary: "#0f3460",
        midnight: {
          50: "#f0f0f5",
          100: "#d9d9e6",
          200: "#b3b3cc",
          300: "#8c8cb3",
          400: "#666699",
          500: "#404080",
          600: "#333366",
          700: "#26264d",
          800: "#1a1a2e",
          900: "#0d0d1a",
        },
        rose: {
          50: "#fef2f4",
          100: "#fde6ea",
          200: "#fbcdd6",
          300: "#f9a4b3",
          400: "#f47086",
          500: "#e94560",
          600: "#d62847",
          700: "#b41d39",
          800: "#961c34",
          900: "#7e1c32",
        },
        sapphire: {
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#b9d3ff",
          300: "#7cb0ff",
          400: "#3685ff",
          500: "#0f3460",
          600: "#0c2a4d",
          700: "#091f3a",
          800: "#061527",
          900: "#030a14",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        serif: ["Playfair Display", "ui-serif", "Georgia"],
        heading: ["Playfair Display", "ui-serif", "Georgia"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.15)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.25)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        glow: "0 0 20px rgba(233, 69, 96, 0.5)",
        "glow-secondary": "0 0 20px rgba(15, 52, 96, 0.5)",
        button: "0 4px 15px rgba(233, 69, 96, 0.4)",
        "button-hover": "0 6px 25px rgba(233, 69, 96, 0.6)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #e94560 0%, #ff6b8a 100%)",
        "gradient-secondary": "linear-gradient(135deg, #0f3460 0%, #1a5276 100%)",
        "gradient-midnight": "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        "gradient-gold": "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
        "gradient-hero": "linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "fade-in-down": "fadeInDown 0.6s ease-out forwards",
        "slide-in-left": "slideInLeft 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "count-up": "countUp 1.5s ease-out forwards",
        "spin-slow": "spin 8s linear infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(233, 69, 96, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(233, 69, 96, 0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
        "ease-out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
      },
    },
  },
  plugins: [],
};
