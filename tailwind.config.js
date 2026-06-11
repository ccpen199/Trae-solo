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
        primary: '#1B3A5C',
        accent: '#E8763A',
        success: '#2EAD6B',
        warning: '#F5A623',
        error: '#D94452',
        bg: '#F5F6FA',
      },
      fontSize: {
        'helper': ['18px', { lineHeight: '1.6' }],
        'body-lg': ['20px', { lineHeight: '1.6' }],
        'body-xl': ['24px', { lineHeight: '1.6' }],
        'title': ['28px', { lineHeight: '1.4' }],
        'title-lg': ['36px', { lineHeight: '1.3' }],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'badge': '8px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(27, 58, 92, 0.08)',
        'card-hover': '0 4px 20px rgba(27, 58, 92, 0.12)',
      },
      animation: {
        'pulse-cta': 'pulse-cta 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'voice-wave': 'voice-wave 1.2s ease-in-out infinite',
        'border-dash': 'border-dash 8s linear infinite',
      },
      keyframes: {
        'pulse-cta': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(232, 118, 58, 0.4)' },
          '50%': { transform: 'scale(1.04)', boxShadow: '0 0 0 16px rgba(232, 118, 58, 0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'voice-wave': {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1.2)' },
        },
        'border-dash': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '100' },
        },
      },
    },
  },
  plugins: [],
};
