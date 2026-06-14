/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "2rem",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans SC"', '"Noto Sans JP"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#050816',
          900: '#0B1A3A',
          800: '#111F4A',
          700: '#172B5E',
          600: '#233D7A',
          500: '#3957A3',
        },
        neon: {
          pink: '#FF2E88',
          pink2: '#FF5CA6',
          amber: '#F5B544',
          teal: '#2DD4BF',
          violet: '#8B5CF6',
        },
        warn: '#EF4444',
        cash: '#10B981',
      },
      boxShadow: {
        glow: '0 0 32px rgba(255,46,136,0.35)',
        glowA: '0 0 24px rgba(245,181,68,0.35)',
        glowT: '0 0 24px rgba(45,212,191,0.35)',
        card: '0 20px 60px -20px rgba(5,8,22,0.5)',
      },
      backgroundImage: {
        'stage-grad':
          'radial-gradient(1200px 500px at 10% -10%, rgba(255,46,136,0.22), transparent 60%), radial-gradient(1000px 400px at 110% 10%, rgba(139,92,246,0.25), transparent 55%), radial-gradient(800px 400px at 50% 120%, rgba(45,212,191,0.22), transparent 60%)',
        'grid-fade':
          'linear-gradient(180deg, rgba(11,26,58,0.0) 0%, rgba(11,26,58,0.85) 100%)',
      },
      keyframes: {
        beam: {
          '0%': { transform: 'translateY(-40px) scaleY(0.6)', opacity: '0.1' },
          '50%': { opacity: '0.6' },
          '100%': { transform: 'translateY(0) scaleY(1)', opacity: '0.25' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(255,46,136,0.55)' },
          '70%': { boxShadow: '0 0 0 18px rgba(255,46,136,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,46,136,0)' },
        },
      },
      animation: {
        beam: 'beam 3.6s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        pulseRing: 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
