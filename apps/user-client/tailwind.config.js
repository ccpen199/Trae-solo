/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A5CAF',
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CBFF',
          300: '#66B0FF',
          400: '#3396FF',
          500: '#0A5CAF',
          600: '#084A8C',
          700: '#063869',
          800: '#042646',
          900: '#021423',
        },
        accent: '#1890FF',
        success: '#52C41A',
        danger: '#F5222D',
        bg: '#F5FAFF',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(10, 92, 175, 0.08)',
        'card-hover': '0 8px 32px rgba(10, 92, 175, 0.14)',
      },
      backgroundImage: {
        'gov-gradient': 'linear-gradient(135deg, #0A5CAF, #1890FF)',
        'page-gradient': 'linear-gradient(135deg, #E6F2FF, #F5FAFF)',
      },
    },
  },
  plugins: [],
};
