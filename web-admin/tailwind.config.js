/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0ff',
          100: '#c7d8ff',
          200: '#94b3ff',
          300: '#5c8aff',
          400: '#2e70ff',
          500: '#165DFF',
          600: '#0e4ad4',
          700: '#0a3ba8',
          800: '#072d80',
          900: '#052059',
        },
        success: {
          50: '#e6fff0',
          500: '#00B42A',
          600: '#009122',
        },
        warning: {
          50: '#fff3e6',
          500: '#FF7D00',
          600: '#cc6400',
        },
        danger: {
          50: '#ffecec',
          500: '#F53F3F',
          600: '#d63030',
        },
        dark: {
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
        },
      },
    },
  },
  plugins: [],
}
