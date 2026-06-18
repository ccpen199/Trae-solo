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
        primary: {
          50: '#e8ecf4',
          100: '#c5cee3',
          200: '#9eaed0',
          300: '#778ebd',
          400: '#5976af',
          500: '#3b5ea1',
          600: '#2f4f8d',
          700: '#1a365d',
          800: '#142b4d',
          900: '#0e1f38',
        },
        accent: {
          50: '#fef3eb',
          100: '#fde0cc',
          200: '#fbbe8e',
          300: '#f9a05e',
          400: '#f08030',
          500: '#dd6b20',
          600: '#c25a18',
          700: '#a04a14',
          800: '#7f3a10',
          900: '#5e2b0c',
        },
        neutral: {
          50: '#f7fafc',
          100: '#edf2f7',
          200: '#e2e8f0',
          300: '#cbd5e0',
          400: '#a0aec0',
          500: '#718096',
          600: '#4a5568',
          700: '#2d3748',
          800: '#1a202c',
          900: '#171923',
        },
        success: {
          50: '#f0fff4',
          100: '#c6f6d5',
          200: '#9ae6b4',
          300: '#68d391',
          400: '#48bb78',
          500: '#2f855a',
          600: '#276749',
          700: '#22543d',
          800: '#1c4532',
          900: '#19371d',
        },
        danger: {
          50: '#fff5f5',
          100: '#fed7d7',
          200: '#feb2b2',
          300: '#fc8181',
          400: '#f56565',
          500: '#c53030',
          600: '#9b2c2c',
          700: '#822727',
          800: '#63171b',
          900: '#4a1215',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
