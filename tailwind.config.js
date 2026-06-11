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
          50: "#E8F0FE",
          100: "#B4D2FE",
          200: "#81B4FE",
          300: "#4D96FD",
          400: "#1A78FD",
          500: "#0A1628",
          600: "#07101D",
          700: "#050A12",
          800: "#020508",
          900: "#000000",
        },
        "vital-green": {
          50: "#E6FFF7",
          100: "#B3FFE5",
          200: "#80FFD2",
          300: "#4DFFC0",
          400: "#1AFFAD",
          500: "#00E5A0",
          600: "#00B37E",
          700: "#008059",
          800: "#004D35",
          900: "#001A12",
        },
        "alert-red": {
          500: "#FF4757",
          600: "#E63946",
        },
        "warning-amber": {
          500: "#FFBE0B",
          600: "#E6A700",
        },
        "sleep-deep": "#1E3A8A",
        "sleep-light": "#60A5FA",
        "sleep-rem": "#7C3AED",
        "sleep-awake": "#6B7280",
      },
      fontFamily: {
        din: ['"DIN Alternate"', 'Impact', 'sans-serif'],
        pingfang: ['"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-spin": "scan 3s linear infinite",
        "wave-form": "waveform 2s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        scan: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        waveform: {
          "0%, 100%": { transform: "scaleY(0.5)" },
          "50%": { transform: "scaleY(1)" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 229, 160, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 229, 160, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
