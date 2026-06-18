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
        'space': {
          950: '#050B18',
          900: '#0A1628',
          800: '#0F2744',
          700: '#1E3A5F',
          600: '#2D4E7A',
        },
        'gold': {
          50: '#FBF7EC',
          100: '#F4E8C8',
          200: '#E8D295',
          300: '#DCBC62',
          400: '#C9A962',
          500: '#B8943F',
          600: '#95752F',
        },
        'insurance': '#10B981',
        'bank': '#3B82F6',
        'airline': '#7C3AED',
        'telecom': '#06B6D4',
        'risk': '#EF4444',
        'warn': '#F59E0B',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(30,58,95,0.6) 0%, rgba(10,22,40,0.8) 100%)',
        'glow-gold': 'radial-gradient(circle at 50% 50%, rgba(201,169,98,0.25) 0%, transparent 60%)',
        'grid-lines': 'linear-gradient(rgba(201,169,98,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,98,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-size': '40px 40px',
      },
      boxShadow: {
        'glow-gold': '0 0 30px -5px rgba(201,169,98,0.45)',
        'glow-green': '0 0 30px -5px rgba(16,185,129,0.45)',
        'glow-blue': '0 0 30px -5px rgba(59,130,246,0.45)',
        'card': '0 10px 40px -15px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
