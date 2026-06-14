/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E6FDB',
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
        dark: '#343A40',
        muted: '#6C757D',
        light: '#F8F9FA',
      },
    },
  },
  plugins: [],
}

