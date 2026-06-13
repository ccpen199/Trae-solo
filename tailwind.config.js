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
        ink: {
          50: "#F5F6FA",
          100: "#E8EAF0",
          200: "#C8CCDB",
          300: "#9AA0B8",
          400: "#6B7390",
          500: "#47506D",
          600: "#323A55",
          700: "#252C45",
          800: "#1A2332",
          900: "#0F1621",
          950: "#070B13",
        },
        ember: {
          50: "#FFF3EC",
          100: "#FFE2D0",
          200: "#FFC3A0",
          300: "#FF9C66",
          400: "#FF7B3D",
          500: "#FF6B35",
          600: "#F05419",
          700: "#C84110",
          800: "#9E3510",
          900: "#7F2D11",
        },
        mint: {
          50: "#EAFBF2",
          100: "#CAF4DC",
          200: "#97E8BC",
          300: "#5FD694",
          400: "#35C276",
          500: "#22C55E",
          600: "#17A050",
          700: "#147E42",
          800: "#146437",
          900: "#11522F",
        },
        alert: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans SC'", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
        display: ["'Space Grotesk'", "'Noto Sans SC'", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 22, 33, 0.04), 0 4px 16px rgba(15, 22, 33, 0.06)",
        "card-hover": "0 2px 8px rgba(15, 22, 33, 0.06), 0 12px 32px rgba(15, 22, 33, 0.10)",
        glow: "0 0 24px rgba(255, 107, 53, 0.35)",
        inner: "inset 0 2px 4px rgba(15, 22, 33, 0.06)",
      },
      backgroundImage: {
        "grid-ink": "linear-gradient(rgba(26, 35, 50, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 35, 50, 0.06) 1px, transparent 1px)",
        "hero-grad": "radial-gradient(1200px 600px at 10% -10%, rgba(255, 107, 53, 0.12) 0%, transparent 55%), radial-gradient(900px 500px at 100% 0%, rgba(34, 197, 94, 0.08) 0%, transparent 55%), linear-gradient(180deg, #0F1621 0%, #1A2332 100%)",
        "card-grad": "linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 107, 53, 0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(255, 107, 53, 0)" },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        floaty: "floaty 4s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.2s ease-out infinite",
        slideUp: "slideUp 0.4s ease-out both",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
