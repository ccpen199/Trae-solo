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
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#0F52BA',
          600: '#0D47A1',
          700: '#0B3D91',
          800: '#09306B',
          900: '#07244F',
        },
        accent: {
          50: '#FFF3EC',
          100: '#FFE0D0',
          200: '#FFC9A8',
          300: '#FFAA75',
          400: '#FF8B42',
          500: '#FF6B35',
          600: '#E85A24',
          700: '#C74918',
          800: '#A03B12',
          900: '#7A2D0E',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        dark: {
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(15, 82, 186, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0F52BA 0%, #0D47A1 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0F52BA 0%, #0B3D91 50%, #09306B 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF6B35 0%, #E85A24 100%)',
      }
    },
  },
  plugins: [],
};
