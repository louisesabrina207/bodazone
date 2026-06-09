/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Override yellow with a neutral/grey palette to give the site a greyish theme
        yellow: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E9E9EB',
          300: '#D6D6DA',
          400: '#A8A8B3',
          500: '#6B7280',
          600: '#4B5563'
        }
      }
    }
  },
  plugins: []
};
