/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f4',
          100: '#d9ebe2',
          200: '#b3d7c5',
          300: '#8bc6a9',
          400: '#64b48d',
          500: '#2E7D5E',
          600: '#296f54',
          700: '#235e47',
          800: '#1d4d3a',
          900: '#173c2d',
        },
        accent: {
          50: '#fff4ec',
          100: '#ffe4d3',
          200: '#ffc9a7',
          300: '#ffae7a',
          400: '#ff934e',
          500: '#FF8A4C',
          600: '#e67339',
          700: '#cc5c26',
          800: '#b34513',
          900: '#992e00',
        },
        mint: {
          50: '#f2f9f5',
          100: '#e0f2e8',
          200: '#c1e4d1',
          300: '#a2d6ba',
          400: '#8BC6A9',
          500: '#74b892',
          600: '#5da37b',
          700: '#468e64',
          800: '#2f794d',
          900: '#186436',
        },
        neutral: {
          50: '#F7F5F0',
          100: '#e8e4d9',
          200: '#d1c9b3',
          300: '#baae8d',
          400: '#a39367',
          500: '#8c7841',
          600: '#705d34',
          700: '#544227',
          800: '#38271a',
          900: '#2D3436',
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(46, 125, 94, 0.08)',
        'card': '0 8px 30px rgba(46, 125, 94, 0.12)',
        'float': '0 12px 40px rgba(46, 125, 94, 0.16)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
