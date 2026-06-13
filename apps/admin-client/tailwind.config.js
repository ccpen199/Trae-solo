/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A5CAF',
        accent: '#1890FF',
        success: '#52C41A',
        danger: '#F5222D',
        sidebar: '#001529',
        'sidebar-light': '#002140',
        'content-bg': '#F0F2F5',
      },
      width: {
        sidebar: '220px',
        'sidebar-collapsed': '64px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          'Roboto',
          "'PingFang SC'",
          "'Microsoft YaHei'",
          'sans-serif',
        ],
        mono: ['tabular-nums', 'Consolas', 'Monaco', "'Courier New'", 'monospace'],
      },
    },
  },
  plugins: [],
};
