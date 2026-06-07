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
        csg: {
          navy: '#1a3a5c',
          'navy-light': '#2a5a8c',
          'navy-dark': '#0f2a40',
          green: '#00a651',
          'green-light': '#00c964',
          'green-dark': '#008040',
          amber: '#f59e0b',
          red: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
