/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        // 品牌主色 - 胶片橙
        brand: {
          50: '#FFF5F0',
          100: '#FFE4D6',
          200: '#FFC7AD',
          300: '#FFA67A',
          400: '#F5854F',
          500: '#E86A3C',
          600: '#D4542A',
          700: '#B5401F',
          800: '#8B2635',
          900: '#6B1D28',
        },
        // 底色 - 暖米白
        paper: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F5EFE0',
          300: '#EDE4CE',
          400: '#DDD1B5',
          500: '#C9BFA7',
          600: '#A89D83',
          700: '#857B66',
          800: '#5E5749',
          900: '#3A3530',
        },
        // 暗调墨绿
        forest: {
          50: '#F0F5F2',
          100: '#D9E4DE',
          200: '#B3C9BC',
          300: '#84A694',
          400: '#5A8270',
          500: '#2D4A3E',
          600: '#243B31',
          700: '#1C2E27',
          800: '#15221D',
          900: '#0D1613',
        },
        // 金色
        gold: {
          50: '#FBF7EB',
          100: '#F5EDD5',
          200: '#EAD8A3',
          300: '#DCC172',
          400: '#C9A961',
          500: '#B8924A',
          600: '#9A763A',
          700: '#7A5C2F',
          800: '#5A4323',
          900: '#3D2E18',
        },
        // 暗室红
        darkroom: {
          50: '#FBE8EC',
          100: '#F5CDD4',
          200: '#E89AA7',
          300: '#D96A7C',
          400: '#C9475C',
          500: '#8B2635',
          600: '#731F2B',
          700: '#5A1822',
          800: '#421119',
          900: '#2A0B10',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif CN"', 'serif'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        display: ['"Noto Serif SC"', 'serif'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '600' }],
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.375rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'small': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.5' }],
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(58, 53, 48, 0.08)',
        'medium': '0 4px 24px rgba(58, 53, 48, 0.12)',
        'large': '0 8px 40px rgba(58, 53, 48, 0.16)',
        'glow': '0 0 24px rgba(232, 106, 60, 0.35)',
        'gold-glow': '0 0 20px rgba(201, 169, 97, 0.4)',
        'inner-paper': 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'film-roll': 'filmRoll 1s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        filmRoll: {
          '0%': { transform: 'rotate(0deg) scale(0.8)', opacity: '0' },
          '50%': { transform: 'rotate(180deg) scale(1.1)', opacity: '1' },
          '100%': { transform: 'rotate(360deg) scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        'film-perforation': 'repeating-linear-gradient(90deg, transparent, transparent 8px, #1a1a1a 8px, #1a1a1a 12px)',
        'gradient-brand': 'linear-gradient(135deg, #E86A3C 0%, #D4542A 100%)',
        'gradient-paper': 'linear-gradient(180deg, #FAF7F2 0%, #F5EFE0 100%)',
        'gradient-dark': 'linear-gradient(180deg, #3A3530 0%, #1f1c19 100%)',
      },
    },
  },
  plugins: [],
};
