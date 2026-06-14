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
        primary: {
          DEFAULT: '#1A365D',
          light: '#2A4A7F',
          50: '#EBF0F7',
          100: '#D6E1EF',
          200: '#ADC3DF',
          300: '#84A5CF',
          400: '#5B87BF',
          500: '#2A4A7F',
          600: '#1A365D',
          700: '#142B4A',
          800: '#0F2038',
          900: '#091525',
        },
        accent: {
          DEFAULT: '#C53030',
          light: '#E53E3E',
          50: '#FED7D7',
          100: '#FEB2B2',
          200: '#FC8181',
          300: '#F56565',
          400: '#E53E3E',
          500: '#C53030',
          600: '#9B2C2C',
          700: '#822727',
          800: '#63171B',
          900: '#4A1215',
        },
        warm: {
          50: '#F7FAFC',
          100: '#EDF2F7',
          200: '#E2E8F0',
          300: '#CBD5E0',
          400: '#A0AEC0',
          500: '#718096',
          600: '#4A5568',
          700: '#2D3748',
          800: '#1A202C',
          900: '#171923',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
