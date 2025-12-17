/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          900: '#1a1a2e',
          800: '#25274d',
          700: '#464866',
          600: '#6c5ce7',
          500: '#a29bfe',
        },
        indigo: {
          900: '#0c0e27',
          800: '#161b40',
        }
      }
    },
  },
  plugins: [],
}