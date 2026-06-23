export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        primary: { DEFAULT: '#C41D2E', light: '#E8474A', dark: '#9A1725' },
        accent: { DEFAULT: '#D4A843', light: '#E8C96A', dark: '#B08A2E' },
        union: { bg: '#F5F3EF', card: '#FFFFFF', text: '#2D2D2D', muted: '#8C8C8C' }
      },
      fontFamily: { sans: ['Noto Sans SC', 'sans-serif'] }
    }
  },
  plugins: [],
};
