export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#E8F5EE',
          100: '#D1EADD',
          200: '#A3D5BB',
          300: '#75C099',
          400: '#52B788',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#1B4332',
          800: '#143326',
          900: '#0D221A',
        },
        mint: {
          50: '#EDFBF4',
          100: '#D1F2E1',
          200: '#A3E5C3',
          300: '#74D8A5',
          400: '#52B788',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#1B4332',
          800: '#143326',
          900: '#0D221A',
        },
        accent: {
          DEFAULT: '#F4845F',
          light: '#F9A882',
          dark: '#E06B44',
        },
        neutral: {
          text: '#334155',
          bg: '#F8FAFC',
          border: '#E2E8F0',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'nav': '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
