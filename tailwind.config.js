/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        insurance: {
          DEFAULT: '#1677FF',
          50: '#E6F4FF',
          100: '#BAE0FF',
          200: '#91CAFF',
          300: '#69B1FF',
          400: '#4096FF',
          500: '#1677FF',
          600: '#0958D9',
          700: '#003EB3',
          800: '#002C8C',
          900: '#001D66',
        },
        medical: {
          DEFAULT: '#00B42A',
          50: '#F0FFE5',
          100: '#D9FFBF',
          200: '#B3FF80',
          300: '#8CF24D',
          400: '#66E01A',
          500: '#00B42A',
          600: '#009A2E',
          700: '#008033',
          800: '#006638',
          900: '#004D3D',
        },
        warning: {
          DEFAULT: '#FF7D00',
          500: '#FF7D00',
          600: '#F56300',
        },
        danger: {
          DEFAULT: '#F53F3F',
          500: '#F53F3F',
          600: '#CB2634',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
        mono: ['"Roboto Mono"', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'btn': '0 2px 4px rgba(22, 119, 255, 0.3)',
        'btn-hover': '0 4px 12px rgba(22, 119, 255, 0.4)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'ring-expand': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'scan-line': 'scan-line 2s ease-in-out infinite',
        'ring-expand': 'ring-expand 1.5s ease-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(135deg, #1677FF 0%, #0958D9 100%)',
      },
    },
  },
  plugins: [],
}
