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
        brand: {
          50: '#F0F5FB',
          100: '#DCE8F5',
          200: '#B7D1E9',
          300: '#85B0D8',
          400: '#4C84BE',
          500: '#2A639C',
          600: '#1E3A5F',
          700: '#162C47',
          800: '#102036',
          900: '#0B1726',
        },
        accent: {
          50: '#FFF7EE',
          100: '#FFE9D1',
          200: '#FFD0A3',
          300: '#FFB169',
          400: '#FF9538',
          500: '#FF7A00',
          600: '#E56B00',
          700: '#B85500',
          800: '#8F4200',
          900: '#6B3200',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px rgba(30, 58, 95, 0.12), 0 4px 10px rgba(30, 58, 95, 0.08)',
        soft: '0 4px 20px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1E3A5F 0%, #2A639C 50%, #4C84BE 100%)',
        'card-gradient': 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        'warm-gradient': 'linear-gradient(135deg, #FF7A00 0%, #FF9538 100%)',
      },
    },
  },
  plugins: [],
};
