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
        indigo: {
          950: '#0D1342',
          900: '#1A237E',
          800: '#283593',
        },
        amber: {
          600: '#FF8F00',
          500: '#FFA000',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif SC', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'glow-gradient': 'radial-gradient(ellipse at center, rgba(26,35,126,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
