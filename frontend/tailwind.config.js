/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B00',
        secondary: '#FF8C33',
        dark: '#333333',
        light: '#F5F5F5',
        gray: {
          100: '#F8F9FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
      },
      fontSize: {
        'elderly-xs': '18px',
        'elderly-sm': '24px',
        'elderly-base': '28px',
        'elderly-lg': '32px',
        'elderly-xl': '40px',
        'elderly-2xl': '48px',
      },
    },
  },
  plugins: [],
}
