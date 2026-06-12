/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
        num: ['"Poppins"', '"Inter"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#FFF4EC",
          100: "#FFE4D1",
          200: "#FFC6A3",
          300: "#FFA775",
          400: "#FF8948",
          500: "#FF7A3D",
          600: "#E85F22",
          700: "#B84614",
          800: "#88310A",
          900: "#582006",
        },
        teal: {
          50: "#E8F8F6",
          100: "#C7EFEB",
          200: "#8EDFD7",
          300: "#56CFC2",
          400: "#3ACFC0",
          500: "#2EC4B6",
          600: "#20968A",
          700: "#166960",
          800: "#0E3E39",
          900: "#061A18",
        },
        ink: {
          50: "#F7F6FA",
          100: "#ECEAF3",
          200: "#D3CFE1",
          300: "#A8A2C1",
          400: "#7C7894",
          500: "#524E6B",
          600: "#3B3850",
          700: "#2D2A3D",
          800: "#201E2D",
          900: "#11101A",
        },
        cream: {
          50: "#FFFCF8",
          100: "#FFF8F2",
          200: "#FFEFDD",
          300: "#FFE4C4",
        },
        danger: {
          500: "#E63946",
          600: "#CC2330",
        },
        success: {
          500: "#2EC4B6",
          600: "#20968A",
        },
        warn: {
          500: "#F5B041",
          600: "#D9962A",
        },
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(45, 42, 61, 0.08)",
        card: "0 8px 32px -8px rgba(45, 42, 61, 0.12)",
        float: "0 16px 48px -12px rgba(255, 122, 61, 0.25)",
        glow: "0 0 0 3px rgba(255, 122, 61, 0.15)",
      },
      borderRadius: {
        xl2: "14px",
        card: "16px",
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.25)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.35s ease-out both',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF7A3D 0%, #FFA775 100%)',
        'teal-gradient': 'linear-gradient(135deg, #2EC4B6 0%, #56CFC2 100%)',
        'warm-gradient': 'linear-gradient(135deg, #FF7A3D 0%, #F5B041 50%, #2EC4B6 100%)',
        'hero-gradient': 'radial-gradient(circle at 20% 20%, rgba(255,122,61,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(46,196,182,0.12) 0%, transparent 50%)',
        'card-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F2 100%)',
      },
    },
  },
  plugins: [],
};
