/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36adf6',
          500: '#0c93e7',
          600: '#0074c7',
          700: '#005ca1',
          800: '#004f85',
          900: '#00426e',
        },
        community: {
          green: '#22c55e',
          orange: '#f97316',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
};
