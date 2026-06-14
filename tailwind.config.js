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
        primary: {
          DEFAULT: '#00d4ff',
          dark: '#00a3cc',
          light: '#33ddff',
        },
        danger: {
          DEFAULT: '#ff6b35',
          dark: '#cc5529',
          light: '#ff8a5e',
        },
        success: {
          DEFAULT: '#00e676',
          dark: '#00b85e',
          light: '#33eb91',
        },
        warning: {
          DEFAULT: '#ffab00',
          dark: '#cc8900',
          light: '#ffbc33',
        },
        surface: {
          DEFAULT: '#1a2332',
          dark: '#0f1923',
          light: '#243447',
          border: '#2a3a4e',
        },
        info: '#5c6bc0',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'blink': 'blink 1s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};
