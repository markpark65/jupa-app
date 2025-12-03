/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'music-bar': 'music-bar 0.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'music-bar': {
          '0%': { height: '4px' },
          '100%': { height: '24px' }
        }
      }
    },
  },
  plugins: [],
}