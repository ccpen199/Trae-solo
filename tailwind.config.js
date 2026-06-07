/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      colors: {
        'vms-bg': '#1a1f2e',
        'vms-surface': '#222839',
        'vms-surface-2': '#2a3145',
        'vms-border': '#343c54',
        'vms-primary': '#3b82f6',
        'vms-primary-hover': '#2563eb',
        'vms-warn': '#f59e0b',
        'vms-success': '#10b981',
        'vms-danger': '#ef4444',
        'vms-text': '#e2e8f0',
        'vms-text-muted': '#94a3b8',
      },
      boxShadow: {
        'vms-glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'vms-card': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'vms-grid': "linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'vms-grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
