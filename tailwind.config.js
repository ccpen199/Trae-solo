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
        "industrial-blue": {
          50: "#E8F0FF",
          100: "#D1E1FF",
          200: "#A3C3FF",
          300: "#75A5FF",
          400: "#4787FF",
          500: "#165DFF",
          600: "#124BCC",
          700: "#0D3999",
          800: "#092666",
          900: "#041433",
        },
        "vital-orange": {
          50: "#FFF3E6",
          100: "#FFE7CC",
          200: "#FFCF99",
          300: "#FFB766",
          400: "#FF9A33",
          500: "#FF7D00",
          600: "#CC6400",
          700: "#994B00",
          800: "#663200",
          900: "#331900",
        },
        success: {
          50: "#E8FBF2",
          100: "#C9F5DD",
          500: "#00B42A",
          600: "#009A23",
          700: "#007D1C",
        },
        warning: {
          50: "#FFFBE6",
          100: "#FFF3B8",
          500: "#FF7D00",
          600: "#E07000",
          700: "#B85C00",
        },
        danger: {
          50: "#FFF0F0",
          100: "#FFD9D9",
          500: "#F53F3F",
          600: "#D92F2F",
          700: "#BD1F1F",
        },
        info: {
          50: "#E8F3FF",
          100: "#C9E3FF",
          500: "#165DFF",
          600: "#124BCC",
          700: "#0D3999",
        },
      },
      fontFamily: {
        sans: ['"Source Han Sans CN"', '"Noto Sans SC"', "system-ui"],
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', "Georgia"],
        mono: ['"Roboto Mono"', "monospace"],
        "mono-num": ['"Roboto Mono"', "monospace"],
      },
      boxShadow: {
        "industrial": "0 4px 16px rgba(22, 93, 255, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)",
        "industrial-lg": "0 8px 32px rgba(22, 93, 255, 0.16), 0 4px 8px rgba(0, 0, 0, 0.08)",
        "industrial-xl": "0 16px 48px rgba(22, 93, 255, 0.2), 0 8px 16px rgba(0, 0, 0, 0.12)",
        "card-hover": "0 8px 24px rgba(22, 93, 255, 0.15), 0 4px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(22, 93, 255, 0.1)",
        "card-base": "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
      },
      backgroundImage: {
        "grid-pattern": `
          linear-gradient(to right, rgba(22, 93, 255, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(22, 93, 255, 0.05) 1px, transparent 1px)
        `,
        "grid-pattern-dense": `
          linear-gradient(to right, rgba(22, 93, 255, 0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(22, 93, 255, 0.06) 1px, transparent 1px)
        `,
        "industrial-gradient": "linear-gradient(135deg, #165DFF 0%, #0D3999 100%)",
        "industrial-gradient-soft": "linear-gradient(135deg, #E8F0FF 0%, #D1E1FF 100%)",
        "orange-gradient": "linear-gradient(135deg, #FF7D00 0%, #CC6400 100%)",
      },
      backgroundSize: {
        "grid-20": "20px 20px",
        "grid-24": "24px 24px",
        "grid-32": "32px 32px",
        "grid-40": "40px 40px",
      },
      keyframes: {
        "number-scroll": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "card-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "card-lift": {
          "0%": { transform: "translateY(0)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)" },
          "100%": { transform: "translateY(-4px)", boxShadow: "0 8px 24px rgba(22, 93, 255, 0.15), 0 4px 8px rgba(0, 0, 0, 0.06)" },
        },
        "progress-ring": {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--progress-offset, 0)" },
        },
        "progress-bar": {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress-width, 100%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "number-scroll": "number-scroll 0.5s ease-out forwards",
        "card-float": "card-float 3s ease-in-out infinite",
        "card-lift": "card-lift 0.3s ease-out forwards",
        "progress-ring": "progress-ring 1.2s ease-out forwards",
        "progress-bar": "progress-bar 1s ease-out forwards",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
