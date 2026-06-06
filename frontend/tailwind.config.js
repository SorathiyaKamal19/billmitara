/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101828',
        saffron: 'rgb(var(--app-main-color-rgb) / <alpha-value>)',
        mint: '#10b981',
        plum: '#7c3aed'
      },
      boxShadow: {
        soft: '0 18px 60px rgba(16, 24, 40, 0.12)'
      }
    }
  },
  plugins: []
};
