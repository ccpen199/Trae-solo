/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#05050A',
          900: '#0A0A0F',
          850: '#0F0F18',
          800: '#15151F',
          750: '#1A1A27',
          700: '#22222F',
          600: '#2E2E3D',
          500: '#3D3D4F',
          400: '#5A5A6E',
          300: '#86869B',
          200: '#B4B4C4',
          100: '#D7D7E0',
          50: '#F0F0F4',
        },
        forest: {
          900: '#06261D',
          800: '#0A382C',
          700: '#0F4C3A',
          600: '#15634B',
          500: '#1D7E5E',
          400: '#2BA179',
          300: '#4FC498',
          200: '#8BDDB9',
          100: '#C5EFDC',
          50: '#E8F8F0',
        },
        gold: {
          900: '#6B562B',
          800: '#8A6F38',
          700: '#A88846',
          600: '#C9A962',
          500: '#D4BA7A',
          400: '#E0CD97',
          300: '#EBDDB5',
          200: '#F2E8CC',
          100: '#F9F2E1',
          50: '#FCF9F0',
        },
        jade: {
          500: '#1DB954',
          400: '#2ED768',
        },
        coral: {
          500: '#E74C3C',
          400: '#F06A5C',
        },
        amberLux: {
          500: '#F39C12',
          400: '#F8B33D',
        },
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at top, rgba(15,76,58,0.6) 0%, rgba(10,10,15,1) 60%',
        'gold-gradient': 'linear-gradient(135deg, #C9A962 0%, #D4BA7A 50%, #C9A962 100%)',
        'gold-soft': 'linear-gradient(135deg, rgba(201,169,98,0.15) 0%, rgba(212,186,122,0.08) 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'forest-glow': 'radial-gradient(circle at center, rgba(45,161,121,0.25) 0%, transparent 70%)',
      },
      boxShadow: {
        'gold': '0 0 40px -10px rgba(201,169,98,0.45)',
        'gold-sm': '0 0 20px -6px rgba(201,169,98,0.3)',
        'card': '0 20px 60px -20px rgba(0,0,0,0.6)',
        'inset': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      animation: {
        'scan': 'scan 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s linear infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        shimmer: {
          '0%': { 'background-position': '-1000px 0' },
          '100%': { 'background-position': '1000px 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
