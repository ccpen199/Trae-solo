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
          100: '#B9D8FF',
          200: '#8CBEFF',
          300: '#5EA3FF',
          400: '#3A8FFF',
          500: '#165DFF',
          600: '#0E4BD8',
          700: '#083AB0',
          800: '#052A89',
          900: '#031D66',
        },
        water: {
          500: '#00B8D9',
          600: '#0099C2',
        },
        electric: {
          500: '#FF8800',
          600: '#E67300',
        },
        gas: {
          500: '#00B42A',
          600: '#009933',
        },
        warning: {
          500: '#F53F3F',
        },
      },
      fontFamily: {
        sans: ['"Source Han Sans CN"', '"PingFang SC"', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
};
