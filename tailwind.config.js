/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        primary: {
          50: '#E8F3FF',
          100: '#BEDAFF',
          200: '#94BFFF',
          300: '#6AA3FF',
          400: '#4088FF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A2BA6',
          800: '#061979',
          900: '#030D4B',
        },
        gov: {
          red: '#F53F3F',
          orange: '#FF7D00',
          green: '#00B42A',
          blue: '#165DFF',
          cyan: '#0FC6C2',
          purple: '#722ED1',
          gray: {
            50: '#F7F8FA',
            100: '#F2F3F5',
            200: '#E5E6EB',
            300: '#C9CDD4',
            400: '#86909C',
            500: '#4E5969',
            600: '#272E3B',
            700: '#1D2129',
          }
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'sans-serif'],
        display: ['PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
        'dropdown': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
