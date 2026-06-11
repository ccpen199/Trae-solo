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
        dark: {
          900: '#0A1628',
          800: '#0F1F3A',
          700: '#162847',
          600: '#1C3254',
          500: '#243D63',
        },
        electric: {
          DEFAULT: '#00E5A0',
          light: '#33EDBA',
          dark: '#00B880',
          glow: 'rgba(0, 229, 160, 0.3)',
        },
        alert: {
          orange: '#FF8C42',
          red: '#FF4757',
          blue: '#4DA6FF',
          green: '#2ED573',
        },
        surface: {
          card: 'rgba(15, 31, 58, 0.8)',
          hover: 'rgba(22, 40, 71, 0.9)',
          border: 'rgba(36, 61, 99, 0.6)',
        },
      },
      fontFamily: {
        din: ['DIN Alternate', 'Roboto Mono', 'monospace'],
        sans: ['Noto Sans SC', 'Source Han Sans CN', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 160, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 229, 160, 0.25)',
        'glow-alert': '0 0 20px rgba(255, 71, 87, 0.2)',
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(135deg, rgba(15, 31, 58, 0.9) 0%, rgba(10, 22, 40, 0.95) 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0A1628 0%, #0F1F3A 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 229, 160, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 229, 160, 0.3)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
