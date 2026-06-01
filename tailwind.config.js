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
        sf: {
          black: '#1A1A2E',
          dark: '#2B2D42',
          red: '#E63946',
          blue: '#457B9D',
          light: '#F1FAEE',
          green: '#2A9D8F',
          yellow: '#F4A261',
          orange: '#E76F51',
        }
      },
      fontFamily: {
        display: ['DIN Alternate', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Source Han Sans CN"', '"PingFang SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
