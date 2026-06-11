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
        gov: {
          blue: '#1B3A5C',
          'blue-light': '#2A5580',
          'blue-dark': '#0F2440',
          gold: '#C9A84C',
          'gold-light': '#DFC573',
          'gold-dark': '#A88C3A',
        },
        status: {
          success: '#2ECC71',
          warning: '#F39C12',
          danger: '#E74C3C',
          info: '#3498DB',
        },
        surface: {
          primary: '#F8F9FA',
          secondary: '#EDF0F5',
          card: '#FFFFFF',
          hover: '#F0F3F8',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(27, 58, 92, 0.08)',
        'card-hover': '0 8px 24px rgba(27, 58, 92, 0.12)',
        sidebar: '2px 0 8px rgba(27, 58, 92, 0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'count-up': 'countUp 1s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.4s ease-out',
        'progress': 'progress 1.5s ease-out forwards',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};
