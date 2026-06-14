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
        gov: {
          navy: "#0A2E5C",
          blue: "#1A73E8",
          gold: "#D4A843",
          green: "#00A870",
          red: "#E34D59",
          slate: "#F0F4F8",
          dark: "#061B38",
          light: "#E8EFF8",
          mid: "#3B6DB5",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', "Georgia", "serif"],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
