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
          DEFAULT: '#165DFF',
          light: '#4080FF',
          dark: '#0E42D2',
          50: '#E8F0FF',
        },
        secondary: {
          DEFAULT: '#00B42A',
          light: '#23C343',
          dark: '#009A29',
          50: '#E8FFEA',
        },
        accent: {
          DEFAULT: '#FF7D00',
          light: '#FF9A2E',
          dark: '#D25F00',
          50: '#FFF3E8',
        },
        danger: {
          DEFAULT: '#F53F3F',
          light: '#F76560',
          50: '#FFECE8',
        },
        gray: {
          50: '#F7F8FA',
          100: '#F2F3F5',
          200: '#E5E6EB',
          300: '#C9CDD4',
          400: '#A9AEB8',
          500: '#86909C',
          600: '#4E5969',
          700: '#1D2129',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
