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
          50: '#E8F5F5',
          100: '#C5E8E8',
          200: '#9AD6D6',
          300: '#6FBFBF',
          400: '#3FA3A3',
          500: '#0D4F4F',
          600: '#0B4545',
          700: '#093838',
          800: '#072B2B',
          900: '#051E1E',
        },
        gold: {
          50: '#FDF8EC',
          100: '#FAECC5',
          200: '#F5DC8F',
          300: '#ECC95A',
          400: '#D4A843',
          500: '#C49530',
          600: '#A87A22',
          700: '#8C6118',
          800: '#704910',
          900: '#54340A',
        },
        surface: {
          50: '#FFFFFF',
          100: '#F5F6F8',
          200: '#E8EAED',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
        'elevated': '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-header': 'linear-gradient(135deg, #0D4F4F 0%, #0B4545 50%, #093838 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4A843 0%, #C49530 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
      }
    },
  },
  plugins: [],
};
