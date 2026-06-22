/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E40FF",
        accent: "#FF6B1A",
        success: "#00C48C",
        danger: "#FF4757",
        dark: "#0F1629"
      }
    }
  },
  plugins: []
}
