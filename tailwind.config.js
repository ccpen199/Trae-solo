/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
      },
    },
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#1E293B',
        'surface-light': '#334155',
        border: '#475569',
        primary: '#10B981',
        'primary-dark': '#059669',
        warning: '#F59E0B',
        'warning-dark': '#D97706',
        danger: '#EF4444',
        'danger-dark': '#DC2626',
        accent: '#6366F1',
        muted: '#94A3B8',
      },
      fontFamily: {
        serif: ['"Noto Serif SC', '"Source Serif Pro', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.15)',
      },
    },
  },
  plugins: [],
};
