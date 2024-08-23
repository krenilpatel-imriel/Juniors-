/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  extend: {
    colors: {
      primary_button: '#8B62F0',
      secondary_button: '#E017FB',
      'secondary-dark': '#C015E0',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
  plugins: [],
}
