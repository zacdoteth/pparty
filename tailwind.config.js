/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00F0FF',
        'neon-pink': '#FF0055',
        'neon-gold': '#FFD700',
      },
      perspective: {
        '1200': '1200px',
      }
    },
  },
  plugins: [],
}
