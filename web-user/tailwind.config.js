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
          50: '#E8F3FF',
          100: '#BEDAFF',
          200: '#94BFFF',
          300: '#6AA3FF',
          400: '#4080FF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A2BA6',
          800: '#061B79',
          900: '#03114D',
        },
        success: {
          50: '#E8FFEA',
          100: '#B4F4B9',
          200: '#80E889',
          300: '#4CD858',
          400: '#23C334',
          500: '#00B42A',
          600: '#009A29',
          700: '#007D24',
          800: '#00601E',
          900: '#004A18',
        },
        warning: {
          50: '#FFF3E8',
          100: '#FFD9B4',
          200: '#FFBC80',
          300: '#FF9E4C',
          400: '#FF8A23',
          500: '#FF7D00',
          600: '#F26A00',
          700: '#D95600',
          800: '#BF4300',
          900: '#A63300',
        },
        danger: {
          50: '#FFECE8',
          100: '#FDC9C4',
          200: '#FAA29B',
          300: '#F77A72',
          400: '#F6584D',
          500: '#F53F3F',
          600: '#D92630',
          700: '#AE1B29',
          800: '#831322',
          900: '#610D1C',
        },
      },
    },
  },
  plugins: [],
};
