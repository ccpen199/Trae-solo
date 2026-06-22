/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094',
          600: '#a18072',
          700: '#977669',
          800: '#846358',
          900: '#43302b'
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d'
        },
        construction: {
          planning: '#3b82f6',
          demolition: '#ef4444',
          plumbing_electrical: '#f59e0b',
          masonry_carpentry: '#8b5cf6',
          painting: '#ec4899',
          installation: '#14b8a6',
          acceptance: '#22c55e'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(67, 48, 43, 0.12)'
      }
    }
  },
  plugins: []
};
