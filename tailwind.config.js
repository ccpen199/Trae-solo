/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        night: {
          50: "#F0F3FF",
          100: "#D6DDF5",
          200: "#A8B4E5",
          300: "#6D82C9",
          400: "#3B4F8A",
          500: "#1E2A5C",
          600: "#131C45",
          700: "#0B1437",
          800: "#070E27",
          900: "#040817",
        },
        dream: {
          100: "#E8DFFA",
          200: "#D1BEF5",
          300: "#B59CEE",
          400: "#9B7EDB",
          500: "#7C5EC4",
          600: "#5F47A1",
        },
        mint: {
          100: "#DFF3E9",
          200: "#B6E5CF",
          300: "#8ED5B3",
          400: "#7BC8A4",
          500: "#5AAE88",
          600: "#40926D",
        },
        coral: {
          100: "#FFE1E1",
          200: "#FFB8B8",
          300: "#FF8A8A",
          400: "#FF6B6B",
          500: "#F04B4B",
          600: "#D13636",
        },
        silver: {
          100: "#F0F2F8",
          200: "#E0E4EF",
          300: "#C4C9D9",
          400: "#9AA1B8",
          500: "#6E7590",
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Source Han Serif SC"', '"Source Han Serif"', 'serif'],
        sans: ['"PingFang SC"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow-blue': '0 0 40px rgba(109, 130, 201, 0.35)',
        'glow-mint': '0 0 30px rgba(123, 200, 164, 0.4)',
        'glow-coral': '0 0 30px rgba(255, 107, 107, 0.45)',
        'glow-dream': '0 0 35px rgba(155, 126, 219, 0.4)',
        'card': '0 8px 40px rgba(7, 14, 39, 0.5)',
      },
      backgroundImage: {
        'gradient-night': 'linear-gradient(135deg, #0B1437 0%, #1E2A5C 50%, #131C45 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(30, 42, 92, 0.6) 0%, rgba(11, 20, 55, 0.4) 100%)',
        'gradient-mint': 'linear-gradient(135deg, #7BC8A4 0%, #5AAE88 100%)',
        'gradient-coral': 'linear-gradient(135deg, #FF8A8A 0%, #FF6B6B 100%)',
        'gradient-dream': 'linear-gradient(135deg, #B59CEE 0%, #9B7EDB 100%)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
