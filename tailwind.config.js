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
        navy: {
          900: '#0A1628',
          800: '#0F2035',
          700: '#162A45',
          600: '#1E3352',
          500: '#2A4268',
        },
        'emerald-primary': '#00E5A0',
        'emerald-dim': '#00B87D',
        'amber-primary': '#FFB800',
        'amber-dim': '#CC9300',
        danger: '#FF4757',
        cyber: {
          text: '#E8ECF1',
          muted: '#8B9BB4',
          dim: '#5A6B82',
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
