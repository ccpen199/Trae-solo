/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#F0F5FF',
          100: '#D6E4FF',
          200: '#ADC8FF',
          300: '#84ADFF',
          400: '#5B8CFF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A2BA0',
          800: '#061D6E',
          900: '#030F3C',
        },
        danger: {
          50: '#FFF0F0',
          100: '#FFD6D6',
          200: '#FFADAD',
          300: '#FF8484',
          400: '#FF5B5B',
          500: '#F53F3F',
          600: '#CB2634',
          700: '#A11828',
          800: '#6F0E1D',
          900: '#3D080F',
        },
        success: {
          50: '#F0FFF5',
          100: '#D6FFE4',
          200: '#ADFFCA',
          300: '#84FFAF',
          400: '#5BFF95',
          500: '#00B42A',
          600: '#009A29',
          700: '#007D24',
          800: '#005A1C',
          900: '#003711',
        },
        warning: {
          50: '#FFFBE6',
          100: '#FFF2B3',
          200: '#FFE880',
          300: '#FFDD4D',
          400: '#FFD31A',
          500: '#FF9A2E',
          600: '#E67F00',
          700: '#B36100',
          800: '#804400',
          900: '#4D2900',
        },
      },
    },
  },
  plugins: [],
};
