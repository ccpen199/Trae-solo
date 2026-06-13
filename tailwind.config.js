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
          DEFAULT: '#0F2B46',
          light: '#1A3A5C',
          dark: '#0A1E33',
        },
        accent: {
          DEFAULT: '#FF6B35',
          light: '#FF8A5C',
          dark: '#E55A28',
        },
        surface: {
          DEFAULT: '#F5F7FA',
          dark: '#E8ECF1',
        },
        text: {
          DEFAULT: '#2D3748',
          light: '#718096',
          lighter: '#A0AEC0',
        },
        success: '#38A169',
        danger: '#E53E3E',
        warning: '#ED8936',
      },
      fontFamily: {
        display: ['DIN Alternate', 'Noto Sans SC', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'blink': 'blink 1.2s ease-in-out infinite',
        'route-dash': 'route-dash 1s linear infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'route-dash': {
          to: { strokeDashoffset: '-20' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
