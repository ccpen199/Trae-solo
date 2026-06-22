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
          50: '#EFF5FD',
          100: '#D9E8FA',
          200: '#B3D1F4',
          300: '#7CAEE9',
          400: '#3F84DA',
          500: '#1E5EAA',
          600: '#184C8A',
          700: '#143D6E',
          800: '#103258',
          900: '#0B2441',
        },
        warm: {
          50: '#FFF5EC',
          100: '#FFE5CF',
          200: '#FFC69A',
          300: '#FFA15C',
          400: '#FF7A1A',
          500: '#F05C00',
          600: '#CC4700',
        },
        alert: {
          blue: '#1976D2',
          yellow: '#FFC107',
          orange: '#FF7A1A',
          red: '#E53935',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      fontSize: {
        'elderly-base': '20px',
        'elderly-lg': '24px',
        'elderly-xl': '30px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 30s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 4px 20px rgba(30, 94, 170, 0.08)',
        'card-hover': '0 8px 32px rgba(30, 94, 170, 0.16)',
      },
    },
  },
  plugins: [],
};
