/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b35',
        secondary: '#ffd23f',
        gold: '#fbbf24',
        accent: '#06d6a0',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
