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
        "deep-sea": {
          50: "#1E293B",
          100: "#1E293B",
          200: "#1E293B",
          300: "#1E293B",
          400: "#1E293B",
          500: "#0F172A",
          600: "#0F172A",
          700: "#0B1120",
          800: "#0B1120",
          900: "#0B1120",
          950: "#0B1120",
          DEFAULT: "#0F172A",
          light: "#1E293B",
          dark: "#0B1120",
        },
        "amber-orange": {
          50: "#FCD34D",
          100: "#FCD34D",
          200: "#FCD34D",
          300: "#F59E0B",
          400: "#F59E0B",
          500: "#F59E0B",
          600: "#D97706",
          700: "#D97706",
          800: "#D97706",
          900: "#D97706",
          950: "#D97706",
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
          dark: "#D97706",
        },
        mood: {
          mint: "#34D399",
          coral: "#F87171",
          purple: "#A78BFA",
          sky: "#60A5FA",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        wave: "wave 2s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        wave: {
          "0%": { transform: "translateX(0) translateY(0)" },
          "50%": { transform: "translateX(-25%) translateY(-5px)" },
          "100%": { transform: "translateX(-50%) translateY(0)" },
        },
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(245, 158, 11, 0.6)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(245, 158, 11, 0.3)",
        "glow-md": "0 0 30px rgba(245, 158, 11, 0.4)",
        "glow-lg": "0 0 50px rgba(245, 158, 11, 0.5)",
        "glow-xl": "0 0 70px rgba(245, 158, 11, 0.6)",
        "glow-mint": "0 0 20px rgba(52, 211, 153, 0.4)",
        "glow-coral": "0 0 20px rgba(248, 113, 113, 0.4)",
        "glow-purple": "0 0 20px rgba(167, 139, 250, 0.4)",
        "glow-sky": "0 0 20px rgba(96, 165, 250, 0.4)",
      },
      backgroundImage: {
        "gradient-mesh":
          "radial-gradient(at 40% 20%, rgba(52, 211, 153, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(248, 113, 113, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(96, 165, 250, 0.1) 0px, transparent 50%), radial-gradient(at 80% 50%, rgba(167, 139, 250, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(245, 158, 11, 0.1) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(52, 211, 153, 0.1) 0px, transparent 50%)",
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
