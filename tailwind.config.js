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
        'cyber': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        'neon': {
          green: '#10B981',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          pink: '#EC4899',
          orange: '#F59E0B',
          red: '#EF4444',
        },
        'dark': {
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
          950: '#020617',
        }
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'grid-move': 'grid-move 20s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'grid-move': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
        'cyber-gradient': 'linear-gradient(135deg, #0c4a6e 0%, #082f49 50%, #020617 100%)',
      },
      boxShadow: {
        'neon-blue': '0 0 5px #3B82F6, 0 0 10px #3B82F6, 0 0 20px rgba(59, 130, 246, 0.5)',
        'neon-green': '0 0 5px #10B981, 0 0 10px #10B981, 0 0 20px rgba(16, 185, 129, 0.5)',
        'neon-purple': '0 0 5px #8B5CF6, 0 0 10px #8B5CF6, 0 0 20px rgba(139, 92, 246, 0.5)',
        'neon-red': '0 0 5px #EF4444, 0 0 10px #EF4444, 0 0 20px rgba(239, 68, 68, 0.5)',
      },
    },
  },
  plugins: [],
};
