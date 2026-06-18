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
        steel: {
          950: '#0A1628',
          900: '#0F2140',
          800: '#162D54',
          700: '#1E3A68',
          600: '#2A4B80',
          500: '#3D6099',
          400: '#5A7FB3',
          300: '#7FA0CC',
          200: '#ADC3E0',
          100: '#D6E2F0',
          50: '#EBF0F7',
        },
        amber: {
          500: '#F59E0B',
          400: '#FBBF24',
          600: '#D97706',
        },
        ice: {
          500: '#38BDF8',
          400: '#7DD3FC',
          600: '#0284C7',
        },
      },
      fontFamily: {
        display: ['Audiowide', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
