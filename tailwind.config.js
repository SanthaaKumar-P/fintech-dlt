/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0e1a',
        'bg-secondary': '#0f1626',
        'bg-tertiary': '#151e33',
        'border-default': '#1e2a45',
        'border-light': '#2a3a5c',
        'accent': '#3b82f6',
        'accent-glow': '#60a5fa',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'crypto': '#8b5cf6',
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
