/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // The "MicroSmart Dark" Palette
        slate: {
          850: '#151e2e', // Lighter than 900, good for cards/panels
          950: '#020617', // Deep background
        },
        cyan: {
          400: '#22d3ee', // Primary Highlights (The "Laser" look)
          500: '#06b6d4',
          900: '#164e63',
        },
        // Semantic Medical Colors
        danger: {
          DEFAULT: '#ef4444', // High Parasitemia
          glow: 'rgba(239, 68, 68, 0.5)',
        },
        warning: '#f59e0b', // Moderate
        safe: '#10b981',    // Negative/Healthy
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.6) 100%)',
        'grid-pattern': "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}