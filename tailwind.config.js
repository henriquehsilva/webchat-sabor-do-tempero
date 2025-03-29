/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F89D16',
        secondary: '#F5C77E',
        highlight: '#FFD700',
        dark: '#321314',
        text: '#8C552F',
      },
    },
  },
  plugins: [],
};