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
        gov: {
          blue: '#0D3B66',
          'blue-light': '#1A5276',
          'blue-dark': '#0A2942',
          red: '#C41E3A',
          'red-light': '#E8435A',
          gold: '#D4A843',
          'gold-light': '#E8C468',
          bg: '#E8EEF4',
          'bg-light': '#F4F7FA',
          card: '#FFFFFF',
          border: '#CBD5E1',
          text: '#1E293B',
          'text-secondary': '#64748B',
          'text-muted': '#94A3B8',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'STSong', 'SimSun', 'serif'],
        sans: ['Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gov-gradient': 'linear-gradient(135deg, #0D3B66 0%, #1A5276 50%, #0A2942 100%)',
        'hero-gradient': 'linear-gradient(135deg, #0A2942 0%, #0D3B66 40%, #1A5276 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        'gov': '0 2px 8px rgba(13,59,102,0.08)',
        'gov-md': '0 4px 16px rgba(13,59,102,0.12)',
        'gov-lg': '0 8px 32px rgba(13,59,102,0.16)',
        'gov-hover': '0 8px 24px rgba(13,59,102,0.18)',
        'gold': '0 0 12px rgba(212,168,67,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
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
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
