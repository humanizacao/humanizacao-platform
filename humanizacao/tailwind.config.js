/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a2b4a',
          deep: '#0f1c32',
          mid: '#243558',
          light: '#2e4470',
        },
        teal: {
          DEFAULT: '#2d8c6e',
          bright: '#3aab86',
          light: '#4fcba0',
          pale: '#e8f7f2',
          muted: '#a8d9ca',
        },
        slate: {
          brand: '#8899b0',
          light: '#c4d0df',
        },
        risk: {
          critical: '#e05252',
          high: '#e8a53a',
          moderate: '#6c87e8',
          low: '#3aab86',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'teal': '0 4px 20px rgba(45,140,110,0.25)',
        'navy': '0 4px 20px rgba(26,43,74,0.25)',
        'card': '0 1px 3px rgba(26,43,74,0.08)',
        'card-hover': '0 8px 32px rgba(26,43,74,0.14)',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s infinite',
        'fade-in-up': 'fade-in-up 0.4s ease both',
        'slide-in': 'slide-in 0.3s ease both',
        'count-up': 'count-up 1s ease both',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(0.85)' },
        },
        'fade-in-up': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: 0, transform: 'translateX(-16px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
