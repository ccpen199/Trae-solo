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
        navy: {
          50: '#E8EEF4',
          100: '#D1DEE9',
          200: '#A3BDD3',
          300: '#759CBD',
          400: '#477BA7',
          500: '#1A5A91',
          600: '#154A75',
          700: '#103A59',
          800: '#0F2B46',
          900: '#0A1E33',
        },
        accent: {
          50: '#FFF3ED',
          100: '#FFE4D4',
          200: '#FFC5A8',
          300: '#FFA67C',
          400: '#FF8750',
          500: '#FF6B35',
          600: '#E55A25',
          700: '#CC4A15',
          800: '#993810',
          900: '#66260B',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
