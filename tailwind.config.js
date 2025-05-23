/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mpc-dark': '#1a1a1a',
        'mpc-gray': '#2d2d2d',
        'mpc-light': '#404040',
        'mpc-accent': '#ff6b35',
        'mpc-green': '#4ade80',
        'mpc-blue': '#3b82f6',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
} 