/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
    extend: {
      colors: {
        'deep-sea': {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae0ff',
          300: '#7cc5ff',
          400: '#36a3ff',
          500: '#0a84ff',
          600: '#0066e6',
          700: '#004db3',
          800: '#0a2540',
          900: '#061a2e',
          950: '#030f1c',
        },
        'lake-green': {
          50: '#f0fdf9',
          100: '#ccfbe8',
          200: '#9af5d3',
          300: '#60e6ba',
          400: '#2ed19d',
          500: '#00d4aa',
          600: '#00b08a',
          700: '#008a6d',
          800: '#006d58',
          900: '#005849',
        },
        'sunset-orange': {
          50: '#fff7f0',
          100: '#ffedd9',
          200: '#ffd6b3',
          300: '#ffb980',
          400: '#ff924d',
          500: '#ff6b35',
          600: '#f04d1a',
          700: '#c7380f',
          800: '#9d2d12',
          900: '#7e2814',
        },
        'moonlight': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Noto Sans SC"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ripple': 'ripple 0.6s linear',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 170, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 170, 0.8)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'deep-ocean': 'linear-gradient(180deg, #061a2e 0%, #0a2540 50%, #004d66 100%)',
        'sunset-horizon': 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #ff6b35 100%)',
      },
    },
  },
  plugins: [],
};
