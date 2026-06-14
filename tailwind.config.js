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
        ink: {
          950: '#050A14',
          900: '#0B1220',
          800: '#0F172A',
          700: '#1A2238',
          600: '#243049',
          500: '#334155',
        },
        orange: {
          450: '#FB923C',
          500: '#F97316',
          550: '#EA580C',
        },
        signal: {
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
          cyan: '#06B6D4',
          blue: '#3B82F6',
        }
      },
      fontFamily: {
        display: ['Orbitron', 'Noto Sans SC', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(100,116,139,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.08) 1px, transparent 1px)",
        'noise-overlay': "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence baseFrequency=%220.85%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.05%22/%3E%3C/svg%3E')",
        'glow-orange': 'radial-gradient(ellipse at center, rgba(249,115,22,0.15), transparent 70%)',
        'industrial-border': 'linear-gradient(135deg, rgba(249,115,22,0.6) 0%, rgba(100,116,139,0.2) 100%)',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
      },
      boxShadow: {
        'card-industrial': '0 0 0 1px rgba(100,116,139,0.2), 0 4px 24px -8px rgba(0,0,0,0.6)',
        'glow-orange-sm': '0 0 16px rgba(249,115,22,0.25)',
        'glow-green-sm': '0 0 16px rgba(16,185,129,0.25)',
        'glow-red-sm': '0 0 16px rgba(239,68,68,0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 30s linear infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
};
