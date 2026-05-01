/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF4D4F',
        secondary: '#1890FF',
        success: '#52C41A',
        warning: '#FAAD14',
        danger: '#FF4D4F',
        dark: '#1F1F1F',
        'dark-800': '#2D2D2D',
        'dark-700': '#3D3D3D',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
}
