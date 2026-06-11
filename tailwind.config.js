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
          50: '#E8EDF2',
          100: '#C5D0DE',
          200: '#8BA3BD',
          300: '#51769C',
          400: '#2A4F74',
          500: '#0A2647',
          600: '#081E3A',
          700: '#06162D',
          800: '#040E20',
          900: '#020713',
        },
        cyber: {
          50: '#E6FFF6',
          100: '#B3FFE3',
          200: '#80FFD0',
          300: '#4DFFBD',
          400: '#2EF2A5',
          500: '#1AD98E',
          600: '#14B873',
          700: '#0F965B',
          800: '#0A7444',
          900: '#05522D',
        },
        warm: {
          50: '#FFF3ED',
          100: '#FFE0CC',
          200: '#FFC299',
          300: '#FFA366',
          400: '#FF8A42',
          500: '#FF6B35',
          600: '#E55A24',
          700: '#CC4A15',
          800: '#993A10',
          900: '#66290B',
        },
      },
      fontFamily: {
        display: ['"DingTalk JinBuTi"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'barrage': 'barrage 8s linear infinite',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(46, 242, 165, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(46, 242, 165, 0.6), 0 0 40px rgba(46, 242, 165, 0.2)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        barrage: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};
