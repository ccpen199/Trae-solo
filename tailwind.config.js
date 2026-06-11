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
          50: '#EBF0F8',
          100: '#D6E1F0',
          200: '#ADC3E1',
          300: '#84A5D2',
          400: '#5B87C3',
          500: '#1A4B8C',
          600: '#15407A',
          700: '#103568',
          800: '#0B2A56',
          900: '#061F44',
        },
        accent: {
          50: '#FEF0E8',
          100: '#FDDDD0',
          200: '#FBBBA1',
          300: '#F89972',
          400: '#F67743',
          500: '#E86830',
          600: '#C55728',
          700: '#A24620',
          800: '#7F3518',
          900: '#5C2410',
        },
        gov: {
          bg: '#F0F4F8',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#2D3748',
          muted: '#718096',
          success: '#38A169',
          warning: '#D69E2E',
          error: '#E53E3E',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"HarmonyOS Sans"', '"PingFang SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'elevated': '0 10px 25px rgba(0,0,0,0.1), 0 6px 10px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
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
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
