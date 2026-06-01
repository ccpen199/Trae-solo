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
        cinema: {
          bg: '#0F172A',
          'bg-light': '#1E293B',
          'bg-dark': '#020617',
          red: '#DC2626',
          'red-light': '#EF4444',
          'red-dark': '#991B1B',
          gold: '#D97706',
          'gold-light': '#F59E0B',
          'gold-dark': '#B45309',
          text: '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-muted': '#64748B',
          border: '#334155',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(220, 38, 38, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-cinema': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        'gradient-red': 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
      },
    },
  },
  plugins: [],
};
